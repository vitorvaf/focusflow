using FluentAssertions;
using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Tests;

public class ProjectServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;
    private readonly ProjectService _sut;
    private readonly string _tempDir;

    public ProjectServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _sync = new ObsidianSyncService(_db, NullLogger<ObsidianSyncService>.Instance);
        _sut = new ProjectService(_db, _sync);

        _tempDir = Path.Combine(Path.GetTempPath(), "focusflow-project-service-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        _db.Dispose();
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }

    [Fact]
    public async Task DeleteAsync_ProjectWithTasksWithoutDestination_ThrowsInvalidOperationException()
    {
        await SeedProjectAsync("Geral", _tempDir);
        var source = await SeedProjectAsync("Origem", _tempDir);
        _db.Tasks.Add(new TaskItem { ProjectId = source.Id, Title = "Tarefa 1", Status = TaskStatus.Todo, SortOrder = 0 });
        await _db.SaveChangesAsync();

        var act = async () => await _sut.DeleteAsync(source.Id, targetProjectId: null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Selecione um projeto de destino*");
    }

    [Fact]
    public async Task DeleteAsync_ProjectWithTasksAndDestination_MovesTasksReordersAndDeletesVaultOutput()
    {
        await SeedProjectAsync("Geral", _tempDir);
        var target = await SeedProjectAsync("Destino", _tempDir);
        var source = await SeedProjectAsync("Origem", _tempDir);

        _db.Tasks.AddRange(
            new TaskItem { ProjectId = target.Id, Title = "Tarefa destino", Status = TaskStatus.Todo, SortOrder = 3 },
            new TaskItem { ProjectId = source.Id, Title = "Tarefa A", Status = TaskStatus.Todo, SortOrder = 1 },
            new TaskItem { ProjectId = source.Id, Title = "Tarefa B", Status = TaskStatus.InProgress, SortOrder = 5 }
        );
        await _db.SaveChangesAsync();

        await _sync.SyncProjectToVault(source.Id);
        var sourceKanbanPath = Path.Combine(_tempDir, "Origem", "kanban.md");
        File.Exists(sourceKanbanPath).Should().BeTrue();

        var deleted = await _sut.DeleteAsync(source.Id, target.Id);

        deleted.Should().BeTrue();
        (await _db.Projects.AnyAsync(p => p.Id == source.Id)).Should().BeFalse();

        var destinationTasks = await _db.Tasks
            .Where(t => t.ProjectId == target.Id)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        destinationTasks.Select(t => t.Title).Should().ContainInOrder("Tarefa destino", "Tarefa A", "Tarefa B");
        destinationTasks.Select(t => t.SortOrder).Should().ContainInOrder(3, 4, 5);
        File.Exists(sourceKanbanPath).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_ProjectWithoutTasks_AllowsDeleteWithoutDestination()
    {
        await SeedProjectAsync("Geral", _tempDir);
        var emptyProject = await SeedProjectAsync("Projeto vazio", _tempDir);

        var deleted = await _sut.DeleteAsync(emptyProject.Id, targetProjectId: null);

        deleted.Should().BeTrue();
        (await _db.Projects.AnyAsync(p => p.Id == emptyProject.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_GeralProject_ThrowsInvalidOperationException()
    {
        var geral = await SeedProjectAsync("Geral", _tempDir);

        var act = async () => await _sut.DeleteAsync(geral.Id, targetProjectId: null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*não pode ser excluído*");
    }

    [Fact]
    public async Task DeleteAsync_TargetProjectSameAsSource_ThrowsInvalidOperationException()
    {
        await SeedProjectAsync("Geral", _tempDir);
        var source = await SeedProjectAsync("Projeto", _tempDir);
        _db.Tasks.Add(new TaskItem { ProjectId = source.Id, Title = "Tarefa", Status = TaskStatus.Todo, SortOrder = 0 });
        await _db.SaveChangesAsync();

        var act = async () => await _sut.DeleteAsync(source.Id, source.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*destino deve ser diferente*");
    }

    [Fact]
    public async Task UpdateAsync_RenameProject_RemovesOldVaultOutputAndCreatesNewOne()
    {
        var project = await SeedProjectAsync("Projeto Antigo", _tempDir);
        _db.Tasks.Add(new TaskItem { ProjectId = project.Id, Title = "Tarefa", Status = TaskStatus.Todo, SortOrder = 0 });
        await _db.SaveChangesAsync();

        await _sync.SyncProjectToVault(project.Id);

        var oldPath = Path.Combine(_tempDir, "Projeto Antigo", "kanban.md");
        var newPath = Path.Combine(_tempDir, "Projeto Novo", "kanban.md");

        File.Exists(oldPath).Should().BeTrue();

        var updated = await _sut.UpdateAsync(project.Id, new UpdateProjectRequest { Name = "Projeto Novo" });

        updated.Should().NotBeNull();
        updated!.Name.Should().Be("Projeto Novo");
        File.Exists(oldPath).Should().BeFalse();
        File.Exists(newPath).Should().BeTrue();
    }

    private async Task<Project> SeedProjectAsync(string name, string? vaultPath)
    {
        var project = new Project { Name = name, VaultPath = vaultPath, Color = "#6366f1" };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project;
    }
}
