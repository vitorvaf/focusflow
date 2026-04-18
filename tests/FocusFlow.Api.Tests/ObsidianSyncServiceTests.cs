using FluentAssertions;
using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using FocusFlow.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Tests;

public class ObsidianSyncServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sut;
    private readonly string _tempDir;

    public ObsidianSyncServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _sut = new ObsidianSyncService(_db, NullLogger<ObsidianSyncService>.Instance);
        _tempDir = Path.Combine(Path.GetTempPath(), "focusflow-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        _db.Dispose();
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, recursive: true);
    }

    // ── SyncProjectToVault ──────────────────────────────────────────────────────

    [Fact]
    public async Task SyncProjectToVault_ProjectWithVaultPath_CreatesMarkdownFile()
    {
        var project = await SeedProjectAsync("Meu Projeto", _tempDir);

        await _sut.SyncProjectToVault(project.Id);

        var expectedFile = Path.Combine(_tempDir, "Meu Projeto", "kanban.md");
        File.Exists(expectedFile).Should().BeTrue();
    }

    [Fact]
    public async Task SyncProjectToVault_ProjectWithVaultPath_FileContainsKanbanFrontmatter()
    {
        var project = await SeedProjectAsync("Teste Projeto", _tempDir);

        await _sut.SyncProjectToVault(project.Id);

        var content = await File.ReadAllTextAsync(Path.Combine(_tempDir, "Teste Projeto", "kanban.md"));
        content.Should().StartWith("---\nkanban-plugin: basic\n---");
    }

    [Fact]
    public async Task SyncProjectToVault_ProjectWithoutVaultPath_DoesNotCreateFile()
    {
        var project = await SeedProjectAsync("Sem Vault", vaultPath: null);

        await _sut.SyncProjectToVault(project.Id);

        Directory.GetFiles(_tempDir).Should().BeEmpty();
    }

    [Fact]
    public async Task SyncProjectToVault_ProjectWithWhitespaceVaultPath_DoesNotCreateFile()
    {
        var project = await SeedProjectAsync("Espaço em Branco", vaultPath: "   ");

        await _sut.SyncProjectToVault(project.Id);

        Directory.GetFiles(_tempDir).Should().BeEmpty();
    }

    [Fact]
    public async Task SyncProjectToVault_NonExistentProjectId_DoesNotThrow()
    {
        var act = async () => await _sut.SyncProjectToVault(9999);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SyncProjectToVault_VaultDirDoesNotExist_CreatesDirectoryAndFile()
    {
        var nestedDir = Path.Combine(_tempDir, "nested", "vault");
        var project = await SeedProjectAsync("Projeto Aninhado", nestedDir);

        await _sut.SyncProjectToVault(project.Id);

        File.Exists(Path.Combine(nestedDir, "Projeto Aninhado", "kanban.md")).Should().BeTrue();
    }

    [Fact]
    public async Task SyncProjectToVault_ProjectNameWithInvalidChars_CreatesSanitizedFile()
    {
        var project = await SeedProjectAsync("Projeto/Com/Slash", _tempDir);

        await _sut.SyncProjectToVault(project.Id);

        var expectedFile = Path.Combine(_tempDir, "Projeto_Com_Slash", "kanban.md");
        File.Exists(expectedFile).Should().BeTrue();
    }

    [Fact]
    public async Task SyncProjectToVault_CalledTwice_OverwritesExistingFile()
    {
        var project = await SeedProjectAsync("Sobrescrever Projeto", _tempDir);
        await _sut.SyncProjectToVault(project.Id);

        _db.Tasks.Add(new TaskItem { ProjectId = project.Id, Title = "Nova Tarefa", Status = TaskStatus.Todo });
        await _db.SaveChangesAsync();
        await _sut.SyncProjectToVault(project.Id);

        var content = await File.ReadAllTextAsync(Path.Combine(_tempDir, "Sobrescrever Projeto", "kanban.md"));
        content.Should().Contain("Nova Tarefa");
    }

    [Fact]
    public async Task SyncProjectToVault_VaultPathWithForwardSlashes_CreatesFileCorrectly()
    {
        var forwardSlashPath = _tempDir.Replace(Path.DirectorySeparatorChar, '/');
        var project = await SeedProjectAsync("Unix Path Projeto", forwardSlashPath);

        await _sut.SyncProjectToVault(project.Id);

        File.Exists(Path.Combine(_tempDir, "Unix Path Projeto", "kanban.md")).Should().BeTrue();
    }

    // ── GenerateKanbanMarkdown ────────────────────────────────────────────────

    [Fact]
    public void GenerateKanbanMarkdown_EmptyProject_ContainsFourColumns()
    {
        var project = new Project { Id = 1, Name = "Empty", Tasks = [] };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("## Backlog");
        markdown.Should().Contain("## A Fazer");
        markdown.Should().Contain("## Em Progresso");
        markdown.Should().Contain("## Concluído");
    }

    [Fact]
    public void GenerateKanbanMarkdown_PendingTask_FormatsAsUnchecked()
    {
        var project = new Project
        {
            Id = 1,
            Name = "Project",
            Tasks =
            [
                new TaskItem { Title = "Tarefa Backlog", Status = TaskStatus.Backlog, Tags = [], EstimatedPomodoros = 0 }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("- [ ] Tarefa Backlog");
    }

    [Fact]
    public void GenerateKanbanMarkdown_DoneTask_FormatsAsCheckedWithDate()
    {
        var completedAt = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        var project = new Project
        {
            Id = 1,
            Name = "Project",
            Tasks =
            [
                new TaskItem
                {
                    Title = "Tarefa Concluída",
                    Status = TaskStatus.Done,
                    CompletedAt = completedAt,
                    Tags = [],
                    EstimatedPomodoros = 0
                }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("- [x] Tarefa Concluída ✅ 2025-03-15");
    }

    [Fact]
    public void GenerateKanbanMarkdown_TaskWithPomodoroEstimate_IncludesPomodoroCount()
    {
        var project = new Project
        {
            Id = 1,
            Name = "Project",
            Tasks =
            [
                new TaskItem
                {
                    Title = "Com Pomodoro",
                    Status = TaskStatus.InProgress,
                    EstimatedPomodoros = 4,
                    CompletedPomodoros = 1,
                    Tags = []
                }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("🍅 1/4");
    }

    [Fact]
    public void GenerateKanbanMarkdown_TaskWithTags_FormatsTagsAsHashSlug()
    {
        var project = new Project
        {
            Id = 1,
            Name = "Project",
            Tasks =
            [
                new TaskItem
                {
                    Title = "Com Tag",
                    Status = TaskStatus.Todo,
                    EstimatedPomodoros = 0,
                    Tags = [new Tag { Id = 1, Name = "Minha Tag" }]
                }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("#minha-tag");
    }

    [Fact]
    public void GenerateKanbanMarkdown_ArchivedTask_IsExcludedFromAllColumns()
    {
        var project = new Project
        {
            Id = 1,
            Name = "Project",
            Tasks =
            [
                new TaskItem { Title = "Arquivada", Status = TaskStatus.Archived, Tags = [], EstimatedPomodoros = 0 }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().NotContain("Arquivada");
    }

    [Fact]
    public void GenerateKanbanMarkdown_ContainsKanbanSettingsFooter()
    {
        var project = new Project { Id = 1, Name = "Project", Tasks = [] };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(project);

        markdown.Should().Contain("%% kanban:settings");
        markdown.Should().Contain("\"kanban-plugin\":\"basic\"");
        markdown.Should().EndWith("%%");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Project> SeedProjectAsync(string name, string? vaultPath)
    {
        var project = new Project { Name = name, VaultPath = vaultPath };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project;
    }
}
