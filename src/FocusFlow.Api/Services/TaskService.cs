using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Services;

public class TaskService
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;

    public TaskService(AppDbContext db, ObsidianSyncService sync)
    {
        _db = db;
        _sync = sync;
    }

    public async Task<List<TaskItemDto>> GetAllAsync(int projectId, TaskStatus? status = null)
    {
        var query = _db.Tasks
            .AsNoTracking()
            .Include(t => t.Tags)
            .Where(t => t.ProjectId == projectId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        var tasks = await query.OrderBy(t => t.SortOrder).ToListAsync();
        return tasks.Select(t => t.ToDto()).ToList();
    }

    public async Task<TaskItemDto?> GetByIdAsync(int id)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        return task?.ToDto();
    }

    public async Task<TaskItemDto> CreateAsync(CreateTaskRequest request)
    {
        var maxSort = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .Select(t => (int?)t.SortOrder)
            .MaxAsync() ?? -1;

        var entity = request.ToEntity();
        entity.SortOrder = maxSort + 1;

        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync();

        await _db.Entry(entity).Collection(t => t.Tags).LoadAsync();
        await _sync.SyncProjectToVault(entity.ProjectId);

        return entity.ToDto();
    }

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
        await _sync.SyncProjectToVault(task.ProjectId);

        return task.ToDto();
    }

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
        await _sync.SyncProjectToVault(task.ProjectId);

        return task.ToDto();
    }

    public async Task<TaskItemDto?> ReorderAsync(int id, int newSortOrder)
    {
        var task = await _db.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return null;

        task.SortOrder = newSortOrder;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _sync.SyncProjectToVault(task.ProjectId);

        return task.ToDto();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return false;

        var projectId = task.ProjectId;
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        await _sync.SyncProjectToVault(projectId);

        return true;
    }
}
