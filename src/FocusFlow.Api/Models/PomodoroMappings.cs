namespace FocusFlow.Api.Models;

/// <summary>Extension methods for mapping Pomodoro entities to DTOs.</summary>
public static class PomodoroMappings
{
    /// <summary>Maps a <see cref="PomodoroSession"/> entity to a <see cref="PomodoroSessionDto"/>.</summary>
    /// <param name="session">The entity to map.</param>
    /// <returns>The mapped DTO.</returns>
    public static PomodoroSessionDto ToDto(this PomodoroSession session) => new()
    {
        Id             = session.Id,
        TaskId         = session.TaskId,
        StartedAt      = session.StartedAt,
        EndedAt        = session.EndedAt,
        DurationMinutes = session.DurationMinutes,
        Type           = session.Type,
        Completed      = session.Completed,
    };
}
