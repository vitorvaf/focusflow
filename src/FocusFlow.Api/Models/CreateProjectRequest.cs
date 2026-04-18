using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

public class CreateProjectRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? VaultPath { get; set; }

    [MaxLength(7)]
    public string Color { get; set; } = "#6366f1";

    public Project ToEntity()
    {
        return new Project
        {
            Name      = Name.Trim(),
            VaultPath = VaultPath?.Trim(),
            Color     = Color,
        };
    }
}
