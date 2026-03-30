using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Request body for changing the sort position of a task within its column.</summary>
public class ReorderTaskRequest
{
    [Required, Range(0, int.MaxValue)]
    public int SortOrder { get; set; }
}
