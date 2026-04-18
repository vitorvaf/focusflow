using System.ComponentModel.DataAnnotations;

namespace FocusFlow.Api.Models;

/// <summary>Request body for starting a new Pomodoro session.</summary>
public class StartPomodoroRequest
{
    /// <summary>The task to associate with this session.</summary>
    [Required]
    public int TaskId { get; set; }

    /// <summary>The project to associate with this session.</summary>
    [Required]
    public int ProjectId { get; set; }

    /// <summary>The type of session to start.</summary>
    public PomodoroType Type { get; set; } = PomodoroType.Focus;
}
