namespace FocusFlow.Api.Models;

/// <summary>Aggregate statistics for completed Focus sessions.</summary>
public class PomodoroStatsDto
{
    /// <summary>Number of completed Focus sessions today (UTC).</summary>
    public int TodayFocusSessions { get; set; }

    /// <summary>Number of completed Focus sessions this week (UTC, starting Sunday).</summary>
    public int WeekFocusSessions { get; set; }

    /// <summary>Total completed Focus sessions across all time.</summary>
    public int TotalFocusSessions { get; set; }

    /// <summary>Total focus minutes completed today.</summary>
    public int TodayFocusMinutes { get; set; }
}
