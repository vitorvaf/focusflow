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
    Task<bool> DeleteAsync(int id, int? targetProjectId);
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

        var previousName = project.Name;
        var previousVaultPath = project.VaultPath;

        if (request.Name is not null)       project.Name      = request.Name.Trim();
        if (request.VaultPath is not null)  project.VaultPath = request.VaultPath.Trim();
        if (request.Color is not null)     project.Color     = request.Color;
        project.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var projectNameChanged = !string.Equals(previousName, project.Name, StringComparison.Ordinal);
        var vaultPathChanged = !string.Equals(previousVaultPath, project.VaultPath, StringComparison.Ordinal);

        if (projectNameChanged || vaultPathChanged)
        {
            await _sync.DeleteProjectVaultOutputAsync(previousVaultPath, previousName);
        }

        await _sync.SyncProjectToVault(id);

        return project.ToDto(project.Tasks.Count);
    }

    public async Task<bool> DeleteAsync(int id, int? targetProjectId)
    {
        var project = await _db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return false;

        if (project.Name == "Geral")
        {
            throw new InvalidOperationException("O projeto 'Geral' não pode ser excluído.");
        }

        Project? destinationProject = null;
        var tasksToMove = project.Tasks.OrderBy(t => t.SortOrder).ToList();

        if (tasksToMove.Count > 0)
        {
            if (!targetProjectId.HasValue)
            {
                throw new InvalidOperationException("Este projeto possui tarefas. Selecione um projeto de destino para mover as tarefas.");
            }

            if (targetProjectId.Value == id)
            {
                throw new InvalidOperationException("O projeto de destino deve ser diferente do projeto excluído.");
            }

            destinationProject = await _db.Projects.FirstOrDefaultAsync(p => p.Id == targetProjectId.Value);
            if (destinationProject is null)
            {
                throw new InvalidOperationException("Projeto de destino não encontrado.");
            }

            var maxSortOrder = await _db.Tasks
                .Where(t => t.ProjectId == destinationProject.Id)
                .Select(t => (int?)t.SortOrder)
                .MaxAsync() ?? -1;

            var now = DateTime.UtcNow;
            for (var index = 0; index < tasksToMove.Count; index++)
            {
                var task = tasksToMove[index];
                task.ProjectId = destinationProject.Id;
                task.Project = destinationProject;
                task.SortOrder = maxSortOrder + index + 1;
                task.UpdatedAt = now;
            }
        }

        await _db.SaveChangesAsync();

        var previousVaultPath = project.VaultPath;
        var previousName = project.Name;

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();

        if (destinationProject is not null)
        {
            await _sync.SyncProjectToVault(destinationProject.Id);
        }

        await _sync.DeleteProjectVaultOutputAsync(previousVaultPath, previousName);

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
