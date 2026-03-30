namespace FocusFlow.Api.Models;

public class PomodoroSession
{
    public int Id { get; set; }

    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public int DurationMinutes { get; set; } = 25;
    public PomodoroType Type { get; set; } = PomodoroType.Focus;
    public bool Completed { get; set; } = false;
}
