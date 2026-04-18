namespace FocusFlow.Api.Models;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? VaultPath { get; set; }
    public string Color { get; set; } = "#6366f1";
    public int TaskCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class ProjectMappings
{
    public static ProjectDto ToDto(this Project project, int taskCount = 0)
    {
        return new ProjectDto
        {
            Id        = project.Id,
            Name      = project.Name,
            VaultPath = project.VaultPath,
            Color     = project.Color,
            TaskCount = taskCount,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
        };
    }
}
