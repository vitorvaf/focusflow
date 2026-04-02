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

    // ── SyncBoardToVault ──────────────────────────────────────────────────────

    [Fact]
    public async Task SyncBoardToVault_BoardWithVaultPath_CreatesMarkdownFile()
    {
        var board = await SeedBoardAsync("Meu Board", _tempDir);

        await _sut.SyncBoardToVault(board.Id);

        var expectedFile = Path.Combine(_tempDir, "Meu Board.md");
        File.Exists(expectedFile).Should().BeTrue();
    }

    [Fact]
    public async Task SyncBoardToVault_BoardWithVaultPath_FileContainsKanbanFrontmatter()
    {
        var board = await SeedBoardAsync("Test Board", _tempDir);

        await _sut.SyncBoardToVault(board.Id);

        var content = await File.ReadAllTextAsync(Path.Combine(_tempDir, "Test Board.md"));
        content.Should().StartWith("---\nkanban-plugin: basic\n---");
    }

    [Fact]
    public async Task SyncBoardToVault_BoardWithoutVaultPath_DoesNotCreateFile()
    {
        var board = await SeedBoardAsync("No Vault Board", vaultPath: null);

        await _sut.SyncBoardToVault(board.Id);

        Directory.GetFiles(_tempDir).Should().BeEmpty();
    }

    [Fact]
    public async Task SyncBoardToVault_BoardWithWhitespaceVaultPath_DoesNotCreateFile()
    {
        var board = await SeedBoardAsync("Whitespace Board", vaultPath: "   ");

        await _sut.SyncBoardToVault(board.Id);

        Directory.GetFiles(_tempDir).Should().BeEmpty();
    }

    [Fact]
    public async Task SyncBoardToVault_NonExistentBoardId_DoesNotThrow()
    {
        var act = async () => await _sut.SyncBoardToVault(9999);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SyncBoardToVault_VaultDirDoesNotExist_CreatesDirectoryAndFile()
    {
        var nestedDir = Path.Combine(_tempDir, "nested", "vault");
        var board = await SeedBoardAsync("Nested Board", nestedDir);

        await _sut.SyncBoardToVault(board.Id);

        File.Exists(Path.Combine(nestedDir, "Nested Board.md")).Should().BeTrue();
    }

    [Fact]
    public async Task SyncBoardToVault_BoardNameWithInvalidChars_CreatesSanitizedFile()
    {
        // Use a slash, which is invalid on all platforms (Linux and Windows)
        var board = await SeedBoardAsync("Board/With/Slashes", _tempDir);

        await _sut.SyncBoardToVault(board.Id);

        // Slashes replaced with underscores on all platforms
        var expectedFile = Path.Combine(_tempDir, "Board_With_Slashes.md");
        File.Exists(expectedFile).Should().BeTrue();
    }

    [Fact]
    public async Task SyncBoardToVault_CalledTwice_OverwritesExistingFile()
    {
        var board = await SeedBoardAsync("Overwrite Board", _tempDir);
        await _sut.SyncBoardToVault(board.Id);

        // Add a task between syncs
        _db.Tasks.Add(new TaskItem { BoardId = board.Id, Title = "Nova Tarefa", Status = TaskStatus.Todo });
        await _db.SaveChangesAsync();
        await _sut.SyncBoardToVault(board.Id);

        var content = await File.ReadAllTextAsync(Path.Combine(_tempDir, "Overwrite Board.md"));
        content.Should().Contain("Nova Tarefa");
    }

    [Fact]
    public async Task SyncBoardToVault_VaultPathWithForwardSlashes_CreatesFileCorrectly()
    {
        // Vault path may be provided with forward slashes on any platform
        var forwardSlashPath = _tempDir.Replace(Path.DirectorySeparatorChar, '/');
        var board = await SeedBoardAsync("Unix Path Board", forwardSlashPath);

        await _sut.SyncBoardToVault(board.Id);

        // Path.Combine handles this correctly — file should exist
        File.Exists(Path.Combine(_tempDir, "Unix Path Board.md")).Should().BeTrue();
    }

    // ── GenerateKanbanMarkdown ────────────────────────────────────────────────

    [Fact]
    public void GenerateKanbanMarkdown_EmptyBoard_ContainsFourColumns()
    {
        var board = new Board { Id = 1, Name = "Empty", Tasks = [] };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("## Backlog");
        markdown.Should().Contain("## A Fazer");
        markdown.Should().Contain("## Em Progresso");
        markdown.Should().Contain("## Concluído");
    }

    [Fact]
    public void GenerateKanbanMarkdown_PendingTask_FormatsAsUnchecked()
    {
        var board = new Board
        {
            Id = 1,
            Name = "Board",
            Tasks =
            [
                new TaskItem { Title = "Tarefa Backlog", Status = TaskStatus.Backlog, Tags = [], EstimatedPomodoros = 0 }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("- [ ] Tarefa Backlog");
    }

    [Fact]
    public void GenerateKanbanMarkdown_DoneTask_FormatsAsCheckedWithDate()
    {
        var completedAt = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        var board = new Board
        {
            Id = 1,
            Name = "Board",
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

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("- [x] Tarefa Concluída ✅ 2025-03-15");
    }

    [Fact]
    public void GenerateKanbanMarkdown_TaskWithPomodoroEstimate_IncludesPomodoroCount()
    {
        var board = new Board
        {
            Id = 1,
            Name = "Board",
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

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("🍅 1/4");
    }

    [Fact]
    public void GenerateKanbanMarkdown_TaskWithTags_FormatsTagsAsHashSlug()
    {
        var board = new Board
        {
            Id = 1,
            Name = "Board",
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

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("#minha-tag");
    }

    [Fact]
    public void GenerateKanbanMarkdown_ArchivedTask_IsExcludedFromAllColumns()
    {
        var board = new Board
        {
            Id = 1,
            Name = "Board",
            Tasks =
            [
                new TaskItem { Title = "Arquivada", Status = TaskStatus.Archived, Tags = [], EstimatedPomodoros = 0 }
            ]
        };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().NotContain("Arquivada");
    }

    [Fact]
    public void GenerateKanbanMarkdown_ContainsKanbanSettingsFooter()
    {
        var board = new Board { Id = 1, Name = "Board", Tasks = [] };

        var markdown = ObsidianSyncService.GenerateKanbanMarkdown(board);

        markdown.Should().Contain("%% kanban:settings");
        markdown.Should().Contain("\"kanban-plugin\":\"basic\"");
        markdown.Should().EndWith("%%");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Board> SeedBoardAsync(string name, string? vaultPath)
    {
        var board = new Board { Name = name, VaultPath = vaultPath };
        _db.Boards.Add(board);
        await _db.SaveChangesAsync();
        return board;
    }
}
