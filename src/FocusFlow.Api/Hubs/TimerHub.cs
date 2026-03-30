using Microsoft.AspNetCore.SignalR;

namespace FocusFlow.Api.Hubs;

/// <summary>
/// SignalR hub for real-time Pomodoro timer updates.
/// All broadcasts originate from <see cref="Services.PomodoroService"/> via
/// <see cref="IHubContext{TimerHub}"/>.
/// </summary>
/// <remarks>
/// Server-to-client events emitted by <see cref="Services.PomodoroService"/>:
/// <list type="bullet">
///   <item><c>TimerTick</c>  — every second: <c>{ remainingSeconds, totalSeconds, type }</c></item>
///   <item><c>TimerComplete</c> — on session end: <c>{ type, taskId }</c></item>
///   <item><c>TaskUpdated</c>   — after pomodoro count changes: <c>{ taskId }</c></item>
/// </list>
/// </remarks>
public class TimerHub : Hub
{
}
