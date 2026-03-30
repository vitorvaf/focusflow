using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Services;

/// <summary>Business logic for task management operations.</summary>
public class TaskService
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;

    public TaskService(AppDbContext db, ObsidianSyncService sync)
    {
        _db = db;
        _sync = sync;
    }

    /// <summary>Returns all tasks for a board, optionally filtered by status.</summary>
    /// <param name="boardId">The board ID to query.</param>
    /// <param name="status">Optional status filter.</param>
    /// <returns>List of task DTOs ordered by sort order.</returns>
    public async Task<List<TaskItemDto>> GetAllAsync(int boardId, TaskStatus? status = null)
    {
        var query = _db.Tasks
            .AsNoTracking()
            .Include(t => t.Tags)
            .Where(t => t.BoardId == boardId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        var tasks = await query.OrderBy(t => t.SortOrder).ToListAsync();
        return tasks.Select(t => t.ToDto()).ToList();
    }

    /// <summary>Returns a single task by ID, or null if not found.</summary>
    /// <param name="id">The task ID.</param>
    /// <returns>The task DTO, or null.</returns>
    public async Task<TaskItemDto?> GetByIdAsync(int id)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        return task?.ToDto();
    }

    /// <summary>Creates a new task on the specified board.</summary>
    /// <param name="request">The creation request.</param>
    /// <returns>The created task DTO.</returns>
    public async Task<TaskItemDto> CreateAsync(CreateTaskRequest request)
    {
        var maxSort = await _db.Tasks
            .Where(t => t.BoardId == request.BoardId)
            .Select(t => (int?)t.SortOrder)
            .MaxAsync() ?? -1;

        var entity = request.ToEntity();
        entity.SortOrder = maxSort + 1;

        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync();

        await _db.Entry(entity).Collection(t => t.Tags).LoadAsync();
        await _sync.SyncBoardToVault(entity.BoardId);

        return entity.ToDto();
    }

    /// <summary>Updates the editable fields of an existing task.</summary>
    /// <param name="id">The task ID to update.</param>
    /// <param name="request">Fields to update; null values are ignored.</param>
    /// <returns>The updated task DTO, or null if not found.</returns>
    public async Task<TaskItemDto?> UpdateAsync(int id, UpdateTaskRequest request)
    {
        var task = await _db.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return null;

        if (request.Title is not null)              task.Title              = request.Title;
        if (request.Description is not null)        task.Description        = request.Description;
        if (request.Priority.HasValue)              task.Priority           = request.Priority.Value;
        if (request.EstimatedPomodoros.HasValue)    task.EstimatedPomodoros = request.EstimatedPomodoros.Value;
        if (request.DueDate.HasValue)               task.DueDate            = request.DueDate;

        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(task.BoardId);

        return task.ToDto();
    }

    /// <summary>Moves a task to a new Kanban status column.</summary>
    /// <param name="id">The task ID.</param>
    /// <param name="newStatus">The target status.</param>
    /// <returns>The updated task DTO, or null if not found.</returns>
    public async Task<TaskItemDto?> UpdateStatusAsync(int id, TaskStatus newStatus)
    {
        var task = await _db.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return null;

        task.Status    = newStatus;
        task.UpdatedAt = DateTime.UtcNow;

        if (newStatus == TaskStatus.Done)
            task.CompletedAt ??= DateTime.UtcNow;
        else
            task.CompletedAt = null;

        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(task.BoardId);

        return task.ToDto();
    }

    /// <summary>Changes the sort position of a task within its column.</summary>
    /// <param name="id">The task ID.</param>
    /// <param name="newSortOrder">The new sort order index.</param>
    /// <returns>The updated task DTO, or null if not found.</returns>
    public async Task<TaskItemDto?> ReorderAsync(int id, int newSortOrder)
    {
        var task = await _db.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return null;

        task.SortOrder = newSortOrder;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(task.BoardId);

        return task.ToDto();
    }

    /// <summary>Permanently deletes a task and its Pomodoro sessions.</summary>
    /// <param name="id">The task ID.</param>
    /// <returns>True if the task was found and deleted, false otherwise.</returns>
    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return false;

        var boardId = task.BoardId;
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(boardId);

        return true;
    }
}
