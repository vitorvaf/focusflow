using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Request body for creating a new TaskItem.</summary>
public class CreateTaskRequest
{
    [Required]
    public int ProjectId { get; set; }

    [Required, MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    [Range(1, 100)]
    public int EstimatedPomodoros { get; set; } = 1;

    public DateTime? DueDate { get; set; }
}
