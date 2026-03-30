namespace FocusFlow.Api.Models;

/// <summary>Snapshot of the current Pomodoro timer state.</summary>
public class PomodoroStatusDto
{
    /// <summary>
    /// Current state: <c>Idle</c>, <c>Focus</c>, <c>ShortBreak</c>,
    /// <c>LongBreak</c>, or <c>Paused</c>.
    /// </summary>
    public string State { get; set; } = "Idle";

    /// <summary>Type of the active session, or <c>null</c> when Idle.</summary>
    public PomodoroType? Type { get; set; }

    /// <summary>Task ID associated with the current session, or <c>null</c> when Idle.</summary>
    public int? TaskId { get; set; }

    /// <summary>Remaining seconds in the current interval.</summary>
    public int RemainingSeconds { get; set; }

    /// <summary>Total duration in seconds for the current interval.</summary>
    public int TotalSeconds { get; set; }

    /// <summary>Active session database ID, or <c>null</c> when Idle.</summary>
    public int? SessionId { get; set; }
}
