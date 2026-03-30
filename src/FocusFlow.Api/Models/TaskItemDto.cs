namespace FocusFlow.Api.Models;

/// <summary>Response DTO for a TaskItem.</summary>
public class TaskItemDto
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int EstimatedPomodoros { get; set; }
    public int CompletedPomodoros { get; set; }
    public DateTime? DueDate { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public IReadOnlyList<TagDto> Tags { get; set; } = [];
}
