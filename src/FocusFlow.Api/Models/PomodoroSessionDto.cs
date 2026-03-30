namespace FocusFlow.Api.Models;

/// <summary>Response DTO for a Pomodoro session record.</summary>
public class PomodoroSessionDto
{
    /// <summary>Unique identifier.</summary>
    public int Id { get; set; }

    /// <summary>Associated task ID.</summary>
    public int TaskId { get; set; }

    /// <summary>UTC time the session started.</summary>
    public DateTime StartedAt { get; set; }

    /// <summary>UTC time the session ended, or <c>null</c> if still active.</summary>
    public DateTime? EndedAt { get; set; }

    /// <summary>Configured duration in minutes.</summary>
    public int DurationMinutes { get; set; }

    /// <summary>Session type: Focus, ShortBreak, or LongBreak.</summary>
    public PomodoroType Type { get; set; }

    /// <summary>Whether the session ran to completion.</summary>
    public bool Completed { get; set; }
}
