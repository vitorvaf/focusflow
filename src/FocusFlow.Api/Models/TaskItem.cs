using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>A task item on a Kanban board, optionally linked to Pomodoro sessions.</summary>
public class TaskItem
{
    public int Id { get; set; }

    public int BoardId { get; set; }
    public Board Board { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.Backlog;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public int EstimatedPomodoros { get; set; } = 1;
    public int CompletedPomodoros { get; set; } = 0;

    /// <summary>Optional due date for this task.</summary>
    public DateTime? DueDate { get; set; }

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Set when the task is moved to Done status.</summary>
    public DateTime? CompletedAt { get; set; }

    public ICollection<PomodoroSession> PomodoroSessions { get; set; } = new List<PomodoroSession>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
