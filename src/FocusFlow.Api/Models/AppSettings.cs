using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Persisted key-value store for application settings.</summary>
public class AppSettings
{
    public int Id { get; set; }

    /// <summary>Unique setting key (e.g. "FocusDurationMinutes").</summary>
    [Required, MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    /// <summary>Serialized setting value.</summary>
    [MaxLength(2000)]
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
