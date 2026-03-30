namespace FocusFlow.Api.Models;

/// <summary>Extension methods for mapping between entities and DTOs.</summary>
public static class TaskMappings
{
    /// <summary>Maps a <see cref="TaskItem"/> entity to a <see cref="TaskItemDto"/>.</summary>
    /// <param name="task">The entity to map.</param>
    /// <returns>A populated <see cref="TaskItemDto"/>.</returns>
    public static TaskItemDto ToDto(this TaskItem task) => new()
    {
        Id                 = task.Id,
        BoardId            = task.BoardId,
        Title              = task.Title,
        Description        = task.Description,
        Status             = task.Status,
        Priority           = task.Priority,
        EstimatedPomodoros = task.EstimatedPomodoros,
        CompletedPomodoros = task.CompletedPomodoros,
        DueDate            = task.DueDate,
        SortOrder          = task.SortOrder,
        CreatedAt          = task.CreatedAt,
        UpdatedAt          = task.UpdatedAt,
        CompletedAt        = task.CompletedAt,
        Tags               = task.Tags.Select(t => t.ToDto()).ToList(),
    };

    /// <summary>Maps a <see cref="Tag"/> entity to a <see cref="TagDto"/>.</summary>
    /// <param name="tag">The entity to map.</param>
    /// <returns>A populated <see cref="TagDto"/>.</returns>
    public static TagDto ToDto(this Tag tag) => new()
    {
        Id    = tag.Id,
        Name  = tag.Name,
        Color = tag.Color,
    };

    /// <summary>Creates a new <see cref="TaskItem"/> entity from a <see cref="CreateTaskRequest"/>.</summary>
    /// <param name="request">The creation request.</param>
    /// <returns>An unsaved <see cref="TaskItem"/> entity.</returns>
    public static TaskItem ToEntity(this CreateTaskRequest request) => new()
    {
        BoardId            = request.BoardId,
        Title              = request.Title,
        Description        = request.Description,
        Priority           = request.Priority,
        EstimatedPomodoros = request.EstimatedPomodoros,
        DueDate            = request.DueDate,
        Status             = TaskStatus.Backlog,
        CreatedAt          = DateTime.UtcNow,
        UpdatedAt          = DateTime.UtcNow,
    };
}
