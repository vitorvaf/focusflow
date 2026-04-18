using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FocusFlow.Api.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllAsync();
    Task<ProjectDto?> GetByIdAsync(int id);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request);
    Task<ProjectDto?> UpdateAsync(int id, UpdateProjectRequest request);
    Task<bool> DeleteAsync(int id);
    Task EnsureGeralProjectExistsAsync();
}

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;

    public ProjectService(AppDbContext db, ObsidianSyncService sync)
    {
        _db   = db;
        _sync = sync;
    }

    public async Task<List<ProjectDto>> GetAllAsync()
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Tasks)
            .OrderBy(p => p.Id)
            .ToListAsync();

        return projects.Select(p => p.ToDto(p.Tasks.Count)).ToList();
    }

    public async Task<ProjectDto?> GetByIdAsync(int id)
    {
        var project = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        return project?.ToDto(project.Tasks.Count);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request)
    {
        var entity = request.ToEntity();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _db.Projects.Add(entity);
        await _db.SaveChangesAsync();

        return entity.ToDto();
    }

    public async Task<ProjectDto?> UpdateAsync(int id, UpdateProjectRequest request)
    {
        var project = await _db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return null;

        if (request.Name is not null)       project.Name      = request.Name.Trim();
        if (request.VaultPath is not null)  project.VaultPath = request.VaultPath.Trim();
        if (request.Color is not null)     project.Color     = request.Color;
        project.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _sync.SyncProjectToVault(id);

        return project.ToDto(project.Tasks.Count);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return false;

        if (project.Name == "Geral")
        {
            throw new InvalidOperationException("O projeto 'Geral' não pode ser excluído.");
        }

        var geralProject = await _db.Projects.FirstOrDefaultAsync(p => p.Name == "Geral");
        if (geralProject is null)
        {
            throw new InvalidOperationException("Projeto 'Geral' não encontrado. Não é possível mover as tarefas.");
        }

        var tasksToMove = await _db.Tasks.Where(t => t.ProjectId == id).ToListAsync();
        foreach (var task in tasksToMove)
        {
            task.ProjectId = geralProject.Id;
        }
        await _db.SaveChangesAsync();

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();

        await _sync.SyncProjectToVault(geralProject.Id);

        return true;
    }

    public async Task EnsureGeralProjectExistsAsync()
    {
        var exists = await _db.Projects.AnyAsync(p => p.Name == "Geral");
        if (!exists)
        {
            var hasTasks = await _db.Tasks.AnyAsync();
            
            _db.Projects.Add(new Project
            {
                Id        = 1,
                Name      = "Geral",
                VaultPath = null,
                Color     = "#6366f1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });

            if (hasTasks)
            {
                await _db.Tasks.ExecuteUpdateAsync(s => 
                    s.SetProperty(t => t.ProjectId, 1));
            }

            await _db.SaveChangesAsync();
        }
    }
}
