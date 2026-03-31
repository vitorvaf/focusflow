using System.Text;
using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Services;

/// <summary>Generates and writes Kanban-plugin-compatible Markdown files to the Obsidian vault.</summary>
public class ObsidianSyncService
{
    private static readonly UTF8Encoding Utf8NoBom = new(encoderShouldEmitUTF8Identifier: false);

    private static readonly (string Heading, TaskStatus Status)[] Columns =
    [
        ("## Backlog",      TaskStatus.Backlog),
        ("## A Fazer",      TaskStatus.Todo),
        ("## Em Progresso", TaskStatus.InProgress),
        ("## Concluído",    TaskStatus.Done),
    ];

    private readonly AppDbContext _db;
    private readonly ILogger<ObsidianSyncService> _logger;

    public ObsidianSyncService(AppDbContext db, ILogger<ObsidianSyncService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>Syncs the given board to its configured Obsidian vault path.</summary>
    /// <param name="boardId">The ID of the board to sync.</param>
    public async Task SyncBoardToVault(int boardId)
    {
        var board = await _db.Boards
            .AsNoTracking()
            .Include(b => b.Tasks.OrderBy(t => t.SortOrder))
                .ThenInclude(t => t.Tags)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board is null || string.IsNullOrWhiteSpace(board.VaultPath))
        {
            _logger.LogDebug("Board {BoardId} has no vault path configured. Skipping sync.", boardId);
            return;
        }

        // Normalize path: ensure all slashes are backslashes (Windows-style)
        var normalizedPath = board.VaultPath.Replace("/", "\\").TrimEnd('\\');
        Directory.CreateDirectory(normalizedPath);

        var markdown = GenerateKanbanMarkdown(board);
        // Use manual string concatenation with backslash to ensure consistency on all platforms
        var filePath = normalizedPath + "\\" + board.Name + ".md";
        var tmpPath  = filePath + ".tmp";

        await File.WriteAllTextAsync(tmpPath, markdown, Utf8NoBom);
        File.Move(tmpPath, filePath, overwrite: true);

        _logger.LogInformation("Synced board {BoardId} to {FilePath}", boardId, filePath);
    }

    /// <summary>Generates the full Kanban Markdown content for a board.</summary>
    /// <param name="board">The board with tasks and tags already loaded.</param>
    /// <returns>The Markdown string in Obsidian Kanban plugin format.</returns>
    internal static string GenerateKanbanMarkdown(Board board)
    {
        var sb = new StringBuilder();

        // Frontmatter
        sb.AppendLine("---");
        sb.AppendLine("kanban-plugin: basic");
        sb.AppendLine("---");
        sb.AppendLine();

        // Columns — Archived tasks are excluded from all columns
        foreach (var (heading, status) in Columns)
        {
            sb.AppendLine(heading);
            sb.AppendLine();

            var tasks = board.Tasks
                .Where(t => t.Status == status)
                .OrderBy(t => t.SortOrder);

            foreach (var task in tasks)
                sb.AppendLine(FormatTask(task));

            sb.AppendLine();
        }

        // Kanban plugin settings footer
        sb.AppendLine("%% kanban:settings");
        sb.AppendLine("```json");
        sb.AppendLine("{\"kanban-plugin\":\"basic\",\"list-collapse\":[false,false,false,false]}");
        sb.AppendLine("```");
        sb.Append("%%");

        return sb.ToString();
    }

    private static string FormatTask(TaskItem task)
    {
        var tagsPart   = BuildTagsPart(task);
        var pomoPart   = BuildPomodorosPart(task);

        if (task.Status == TaskStatus.Done)
        {
            var date = (task.CompletedAt ?? task.UpdatedAt).ToString("yyyy-MM-dd");
            return $"- [x] {task.Title}{tagsPart} ✅ {date}";
        }

        return $"- [ ] {task.Title}{tagsPart}{pomoPart}";
    }

    /// <summary>Formats tag names as #lowercase-slug tokens.</summary>
    private static string BuildTagsPart(TaskItem task)
    {
        if (task.Tags.Count == 0) return string.Empty;

        var tags = task.Tags
            .Select(t => "#" + t.Name.ToLowerInvariant().Replace(" ", "-"))
            .ToList();

        return " " + string.Join(" ", tags);
    }

    /// <summary>Returns the 🍅 completed/estimated part, or empty if not applicable.</summary>
    private static string BuildPomodorosPart(TaskItem task)
    {
        if (task.EstimatedPomodoros <= 0) return string.Empty;
        return $" 🍅 {task.CompletedPomodoros}/{task.EstimatedPomodoros}";
    }
}
