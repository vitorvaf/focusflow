using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

public class Tag
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(7)]
    public string Color { get; set; } = "#6366f1";

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
