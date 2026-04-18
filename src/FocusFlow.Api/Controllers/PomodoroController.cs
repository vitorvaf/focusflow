using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FocusFlow.Api.Controllers;

/// <summary>Manages Pomodoro timer sessions and provides session history and statistics.</summary>
[ApiController]
[Route("api/[controller]")]
public class PomodoroController : ControllerBase
{
    private readonly PomodoroService _pomodoroService;

    /// <summary>Initializes a new instance of <see cref="PomodoroController"/>.</summary>
    /// <param name="pomodoroService">The Pomodoro service singleton.</param>
    public PomodoroController(PomodoroService pomodoroService)
    {
        _pomodoroService = pomodoroService;
    }

    /// <summary>Starts a new Pomodoro session.</summary>
    /// <param name="request">Task ID, Project ID and session type.</param>
    /// <returns>The current timer status after starting.</returns>
    [HttpPost("start")]
    public async Task<ActionResult<PomodoroStatusDto>> Start([FromBody] StartPomodoroRequest request)
    {
        try
        {
            var status = await _pomodoroService.StartAsync(request.TaskId, request.ProjectId, request.Type);
            return Ok(status);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails { Title = ex.Message, Status = 409 });
        }
    }

    /// <summary>Pauses the active timer.</summary>
    /// <returns>The current timer status after pausing.</returns>
    [HttpPost("pause")]
    public async Task<ActionResult<PomodoroStatusDto>> Pause()
    {
        try
        {
            var status = await _pomodoroService.PauseAsync();
            return Ok(status);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    /// <summary>Resumes a paused timer.</summary>
    /// <returns>The current timer status after resuming.</returns>
    [HttpPost("resume")]
    public async Task<ActionResult<PomodoroStatusDto>> Resume()
    {
        try
        {
            var status = await _pomodoroService.ResumeAsync();
            return Ok(status);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails { Title = ex.Message, Status = 400 });
        }
    }

    /// <summary>Stops the active session and marks it as incomplete.</summary>
    /// <returns>The current timer status (Idle) after stopping.</returns>
    [HttpPost("stop")]
    public async Task<ActionResult<PomodoroStatusDto>> Stop()
    {
        var status = await _pomodoroService.StopAsync();
        return Ok(status);
    }

    /// <summary>Returns the current timer state.</summary>
    /// <returns>A snapshot of the timer status.</returns>
    [HttpGet("status")]
    public async Task<ActionResult<PomodoroStatusDto>> GetStatus()
    {
        return Ok(await _pomodoroService.GetStatusAsync());
    }

    /// <summary>Returns historical Pomodoro sessions with optional filters.</summary>
    /// <param name="taskId">Filter by task ID.</param>
    /// <param name="from">Filter sessions on or after this UTC date.</param>
    /// <param name="to">Filter sessions on or before this UTC date.</param>
    /// <returns>Matching sessions ordered by start time descending.</returns>
    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<PomodoroSessionDto>>> GetHistory(
        [FromQuery] int? taskId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var sessions = await _pomodoroService.GetHistoryAsync(taskId, from, to);
        return Ok(sessions);
    }

    /// <summary>Returns aggregate statistics for completed Focus sessions.</summary>
    /// <returns>Session counts and focus minutes for today, this week, and all time.</returns>
    [HttpGet("stats")]
    public async Task<ActionResult<PomodoroStatsDto>> GetStats()
    {
        return Ok(await _pomodoroService.GetStatsAsync());
    }
}
