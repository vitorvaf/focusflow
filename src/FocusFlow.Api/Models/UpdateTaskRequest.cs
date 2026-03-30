using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Request body for updating an existing TaskItem. Only provided fields are updated.</summary>
public class UpdateTaskRequest
{
    [MaxLength(500)]
    public string? Title { get; set; }

    public string? Description { get; set; }

    public TaskPriority? Priority { get; set; }

    [Range(1, 100)]
    public int? EstimatedPomodoros { get; set; }

    public DateTime? DueDate { get; set; }
}
