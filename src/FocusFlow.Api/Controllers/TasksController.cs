using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly TaskService _taskService;

    public TasksController(TaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>Returns tasks for a project, optionally filtered by status.</summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="status">Optional status filter.</param>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItemDto>>> GetAll(
        [FromQuery] int projectId,
        [FromQuery] TaskStatus? status = null)
    {
        var tasks = await _taskService.GetAllAsync(projectId, status);
        return Ok(tasks);
    }

    /// <summary>Returns a single task by ID.</summary>
    /// <param name="id">The task ID.</param>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItemDto>> GetById(int id)
    {
        var task = await _taskService.GetByIdAsync(id);
        if (task is null)
            return NotFound(new ProblemDetails { Title = "Tarefa não encontrada", Status = 404 });
        return Ok(task);
    }

    /// <summary>Creates a new task.</summary>
    [HttpPost]
    public async Task<ActionResult<TaskItemDto>> Create([FromBody] CreateTaskRequest request)
    {
        var task = await _taskService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    /// <summary>Updates the editable fields of a task.</summary>
    /// <param name="id">The task ID.</param>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskItemDto>> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        var task = await _taskService.UpdateAsync(id, request);
        if (task is null)
            return NotFound(new ProblemDetails { Title = "Tarefa não encontrada", Status = 404 });
        return Ok(task);
    }

    /// <summary>Moves a task to a different Kanban status.</summary>
    /// <param name="id">The task ID.</param>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TaskItemDto>> UpdateStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        var task = await _taskService.UpdateStatusAsync(id, request.Status);
        if (task is null)
            return NotFound(new ProblemDetails { Title = "Tarefa não encontrada", Status = 404 });
        return Ok(task);
    }

    /// <summary>Changes the sort order of a task within its column.</summary>
    /// <param name="id">The task ID.</param>
    [HttpPatch("{id:int}/reorder")]
    public async Task<ActionResult<TaskItemDto>> Reorder(int id, [FromBody] ReorderTaskRequest request)
    {
        var task = await _taskService.ReorderAsync(id, request.SortOrder);
        if (task is null)
            return NotFound(new ProblemDetails { Title = "Tarefa não encontrada", Status = 404 });
        return Ok(task);
    }

    /// <summary>Permanently deletes a task.</summary>
    /// <param name="id">The task ID.</param>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _taskService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new ProblemDetails { Title = "Tarefa não encontrada", Status = 404 });
        return NoContent();
    }
}
