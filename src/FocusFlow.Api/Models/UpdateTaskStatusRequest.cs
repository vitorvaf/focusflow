using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Request body for moving a task to a different Kanban status.</summary>
public class UpdateTaskStatusRequest
{
    [Required]
    public TaskStatus Status { get; set; }
}
