using FocusFlow.Api.Data;
using FocusFlow.Api.Hubs;
using FocusFlow.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FocusFlow.Api.Services;

/// <summary>
/// Manages the Pomodoro timer state machine, session persistence, and real-time broadcasts.
/// </summary>
/// <remarks>
/// Registered as <b>Singleton</b> — holds shared in-memory timer state.
/// Resolves <see cref="AppDbContext"/> and <see cref="ObsidianSyncService"/> via
/// <see cref="IServiceScopeFactory"/> to avoid captive-dependency issues.
/// </remarks>
public sealed class PomodoroService : IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<TimerHub> _hubContext;
    private readonly ILogger<PomodoroService> _logger;

    // Internal state — only touched while holding _lock
    private enum InternalState { Idle, Running, Paused }

    private readonly object _lock = new();
    private System.Timers.Timer? _timer;
    private InternalState _internalState = InternalState.Idle;
    private PomodoroType _currentType   = PomodoroType.Focus;
    private int  _remainingSeconds;
    private int  _totalSeconds;
    private int? _currentTaskId;
    private int? _currentProjectId;
    private int? _currentSessionId;
    private int  _completedFocusInCycle;

    private const int FocusDurationMinutes    = 25;
    private const int ShortBreakMinutes       = 5;
    private const int LongBreakMinutes        = 15;
    private const int PomodorosUntilLongBreak = 4;

    /// <summary>Initializes a new instance of <see cref="PomodoroService"/>.</summary>
    /// <param name="scopeFactory">Factory for creating DI scopes for scoped services.</param>
    /// <param name="hubContext">SignalR hub context for broadcasting timer events.</param>
    /// <param name="logger">Logger instance.</param>
    public PomodoroService(
        IServiceScopeFactory scopeFactory,
        IHubContext<TimerHub> hubContext,
        ILogger<PomodoroService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext   = hubContext;
        _logger       = logger;
    }

    /// <summary>Starts a new Pomodoro session for the given task.</summary>
    /// <param name="taskId">The task to associate with this session.</param>
    /// <param name="projectId">The project to associate with this session.</param>
    /// <param name="type">Session type: Focus, ShortBreak, or LongBreak.</param>
    /// <returns>The timer status immediately after starting.</returns>
    public async Task<PomodoroStatusDto> StartAsync(int taskId, int projectId, PomodoroType type)
    {
        lock (_lock)
        {
            if (_internalState != InternalState.Idle)
                throw new InvalidOperationException(
                    "Já existe uma sessão ativa. Encerre-a antes de iniciar uma nova.");
        }

        int durationMinutes = type switch
        {
            PomodoroType.ShortBreak => ShortBreakMinutes,
            PomodoroType.LongBreak  => LongBreakMinutes,
            _                       => FocusDurationMinutes,
        };

        int sessionId;
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var session = new PomodoroSession
            {
                TaskId          = taskId,
                StartedAt       = DateTime.UtcNow,
                Type            = type,
                DurationMinutes = durationMinutes,
            };
            db.PomodoroSessions.Add(session);
            await db.SaveChangesAsync();
            sessionId = session.Id;
        }

        lock (_lock)
        {
            _internalState    = InternalState.Running;
            _currentType      = type;
            _currentTaskId    = taskId;
            _currentProjectId = projectId;
            _currentSessionId = sessionId;
            _remainingSeconds = durationMinutes * 60;
            _totalSeconds     = durationMinutes * 60;
            StartInternalTimer();
        }

        return GetStatus();
    }

    /// <summary>Pauses the active timer without ending the session.</summary>
    /// <returns>The timer status after pausing.</returns>
    public Task<PomodoroStatusDto> PauseAsync()
    {
        lock (_lock)
        {
            if (_internalState != InternalState.Running)
                throw new InvalidOperationException("Não há timer ativo para pausar.");

            _timer?.Stop();
            _internalState = InternalState.Paused;
        }
        return Task.FromResult(GetStatus());
    }

    /// <summary>Resumes a paused timer from where it left off.</summary>
    /// <returns>The timer status after resuming.</returns>
    public Task<PomodoroStatusDto> ResumeAsync()
    {
        lock (_lock)
        {
            if (_internalState != InternalState.Paused)
                throw new InvalidOperationException("O timer não está pausado.");

            _internalState = InternalState.Running;
            StartInternalTimer();
        }
        return Task.FromResult(GetStatus());
    }

    /// <summary>Stops the current session and marks it as not completed in the database.</summary>
    /// <returns>The timer status (Idle) after stopping.</returns>
    public async Task<PomodoroStatusDto> StopAsync()
    {
        int? sessionId;
        lock (_lock)
        {
            if (_internalState == InternalState.Idle)
                return GetStatus();

            _timer?.Stop();
            _timer?.Dispose();
            _timer    = null;
            sessionId = _currentSessionId;
            ResetState();
        }

        if (sessionId.HasValue)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var session = await db.PomodoroSessions.FindAsync(sessionId.Value);
            if (session is not null)
            {
                session.EndedAt   = DateTime.UtcNow;
                session.Completed = false;
                await db.SaveChangesAsync();
            }
        }

        return GetStatus();
    }

    /// <summary>Returns a snapshot of the current timer state.</summary>
    /// <returns>Current <see cref="PomodoroStatusDto"/>.</returns>
    public Task<PomodoroStatusDto> GetStatusAsync() => Task.FromResult(GetStatus());

    /// <summary>Returns historical Pomodoro sessions with optional filters.</summary>
    /// <param name="taskId">Filter by task, or <c>null</c> for all tasks.</param>
    /// <param name="from">Inclusive start of the date range.</param>
    /// <param name="to">Inclusive end of the date range.</param>
    /// <returns>Matching sessions ordered by start time descending.</returns>
    public async Task<IEnumerable<PomodoroSessionDto>> GetHistoryAsync(
        int? taskId, DateTime? from, DateTime? to)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var query = db.PomodoroSessions.AsNoTracking().AsQueryable();
        if (taskId.HasValue) query = query.Where(s => s.TaskId    == taskId.Value);
        if (from.HasValue)   query = query.Where(s => s.StartedAt >= from.Value);
        if (to.HasValue)     query = query.Where(s => s.StartedAt <= to.Value);

        var sessions = await query.OrderByDescending(s => s.StartedAt).ToListAsync();
        return sessions.Select(PomodoroMappings.ToDto);
    }

    /// <summary>Returns aggregate statistics for completed Focus sessions.</summary>
    /// <returns>Session counts and focus minutes for today, this week, and all time.</returns>
    public async Task<PomodoroStatsDto> GetStatsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now       = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart  = todayStart.AddDays(-(int)now.DayOfWeek);

        var sessions = await db.PomodoroSessions
            .AsNoTracking()
            .Where(s => s.Type == PomodoroType.Focus && s.Completed)
            .ToListAsync();

        return new PomodoroStatsDto
        {
            TodayFocusSessions = sessions.Count(s => s.StartedAt >= todayStart),
            WeekFocusSessions  = sessions.Count(s => s.StartedAt >= weekStart),
            TotalFocusSessions = sessions.Count,
            TodayFocusMinutes  = sessions
                .Where(s => s.StartedAt >= todayStart)
                .Sum(s => s.DurationMinutes),
        };
    }

    // ── Internal timer machinery ─────────────────────────────────────────────

    private void StartInternalTimer()
    {
        _timer?.Dispose();
        _timer = new System.Timers.Timer(1000) { AutoReset = true };
        _timer.Elapsed += OnTimerTick;
        _timer.Start();
    }

    private void OnTimerTick(object? sender, System.Timers.ElapsedEventArgs e)
    {
        int remaining, total;
        PomodoroType type;
        int? taskId, projectId, sessionId;
        bool completed;

        lock (_lock)
        {
            if (_internalState != InternalState.Running) return;

            _remainingSeconds--;
            remaining = _remainingSeconds;
            total     = _totalSeconds;
            type      = _currentType;
            taskId    = _currentTaskId;
            projectId = _currentProjectId;
            sessionId = _currentSessionId;
            completed = _remainingSeconds <= 0;

            if (completed)
            {
                _logger.LogInformation(
                    "Timer concluído. Tipo: {Type}, TaskId: {TaskId}, ProjectId: {ProjectId}, SessionId: {SessionId}",
                    type, taskId, projectId, sessionId);
                _timer?.Stop();
                ResetState();
            }
        }

        _ = _hubContext.Clients.All.SendAsync("TimerTick",
            new { remainingSeconds = remaining, totalSeconds = total, type = type.ToString() });

        if (completed)
            _ = HandleCompletionAsync(type, taskId, projectId, sessionId);
    }

    private async Task HandleCompletionAsync(
        PomodoroType type, int? taskId, int? projectId, int? sessionId)
    {
        try
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                if (sessionId.HasValue)
                {
                    var session = await db.PomodoroSessions.FindAsync(sessionId.Value);
                    if (session is not null)
                    {
                        session.EndedAt   = DateTime.UtcNow;
                        session.Completed = true;
                        await db.SaveChangesAsync();
                    }
                }

                if (type == PomodoroType.Focus && taskId.HasValue)
                {
                    var task = await db.Tasks.FindAsync(taskId.Value);
                    if (task is not null)
                    {
                        projectId = task.ProjectId;
                        task.CompletedPomodoros++;
                        await db.SaveChangesAsync();
                    }
                }
            }

            if (type == PomodoroType.Focus && projectId.HasValue)
            {
                using var scope = _scopeFactory.CreateScope();
                var sync = scope.ServiceProvider.GetRequiredService<ObsidianSyncService>();
                await sync.SyncProjectToVault(projectId.Value);
            }

            await _hubContext.Clients.All.SendAsync("TimerComplete",
                new { type = type.ToString(), taskId });
            _logger.LogInformation(
                "SignalR 'TimerComplete' enviado. Tipo: {Type}, TaskId: {TaskId}", type, taskId);

            if (taskId.HasValue)
            {
                await _hubContext.Clients.All.SendAsync("TaskUpdated", new { taskId });
                _logger.LogInformation("SignalR 'TaskUpdated' enviado. TaskId: {TaskId}", taskId);
            }

            // Auto-start next break after every Focus session
            if (type == PomodoroType.Focus && taskId.HasValue && projectId.HasValue)
            {
                PomodoroType breakType;
                lock (_lock)
                {
                    _completedFocusInCycle++;
                    breakType = _completedFocusInCycle % PomodorosUntilLongBreak == 0
                        ? PomodoroType.LongBreak
                        : PomodoroType.ShortBreak;
                }
                await StartAsync(taskId.Value, projectId.Value, breakType);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Erro ao finalizar sessão Pomodoro. Tipo: {Type}, TaskId: {TaskId}", type, taskId);
        }
    }

    private PomodoroStatusDto GetStatus()
    {
        lock (_lock)
        {
            var state = _internalState switch
            {
                InternalState.Running => _currentType.ToString(),
                InternalState.Paused  => "Paused",
                _                     => "Idle",
            };
            return new PomodoroStatusDto
            {
                State            = state,
                Type             = _internalState == InternalState.Idle ? null : _currentType,
                TaskId           = _currentTaskId,
                ProjectId        = _currentProjectId,
                RemainingSeconds = _remainingSeconds,
                TotalSeconds     = _totalSeconds,
                SessionId        = _currentSessionId,
            };
        }
    }

    private void ResetState()
    {
        _internalState    = InternalState.Idle;
        _currentTaskId    = null;
        _currentProjectId = null;
        _currentSessionId = null;
        _remainingSeconds = 0;
        _totalSeconds     = 0;
    }

    /// <summary>Stops and releases the internal timer.</summary>
    public void Dispose()
    {
        _timer?.Stop();
        _timer?.Dispose();
    }
}
