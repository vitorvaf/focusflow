namespace FocusFlow.Api.Models;

/// <summary>Response DTO for a Tag.</summary>
public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
