using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

public class UpdateProjectRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? VaultPath { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; }
}
