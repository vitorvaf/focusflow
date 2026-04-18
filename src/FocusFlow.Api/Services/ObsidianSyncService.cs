using System.Text;
using FocusFlow.Api.Data;
using FocusFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FocusFlow.Api.Models.TaskStatus;

namespace FocusFlow.Api.Services;

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

    public async Task SyncProjectToVault(int projectId)
    {
        var project = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Tasks.OrderBy(t => t.SortOrder))
                .ThenInclude(t => t.Tags)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null || string.IsNullOrWhiteSpace(project.VaultPath))
        {
            _logger.LogDebug("Project {ProjectId} has no vault path configured. Skipping sync.", projectId);
            return;
        }

        var vaultPath = project.VaultPath.Trim();
        var projectDir = SanitizeFileName(project.Name);
        var dirPath = Path.Combine(vaultPath, projectDir);
        var filePath = Path.Combine(dirPath, "kanban.md");
        var tmpPath = filePath + ".tmp";

        try
        {
            Directory.CreateDirectory(dirPath);
            var markdown = GenerateKanbanMarkdown(project);
            await File.WriteAllTextAsync(tmpPath, markdown, Utf8NoBom);
            File.Move(tmpPath, filePath, overwrite: true);
            _logger.LogInformation("Synced project {ProjectId} to {FilePath}", projectId, filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync project {ProjectId} to vault path '{VaultPath}'.", projectId, vaultPath);
            if (File.Exists(tmpPath))
            {
                try { File.Delete(tmpPath); } catch { /* best-effort cleanup */ }
            }
        }
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Concat(name.Select(c => invalid.Contains(c) ? '_' : c));
    }

    internal static string GenerateKanbanMarkdown(Project project)
    {
        var sb = new StringBuilder();

        sb.AppendLine("---");
        sb.AppendLine("kanban-plugin: basic");
        sb.AppendLine("---");
        sb.AppendLine();

        foreach (var (heading, status) in Columns)
        {
            sb.AppendLine(heading);
            sb.AppendLine();

            var tasks = project.Tasks
                .Where(t => t.Status == status)
                .OrderBy(t => t.SortOrder);

            foreach (var task in tasks)
                sb.AppendLine(FormatTask(task));

            sb.AppendLine();
        }

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

    private static string BuildTagsPart(TaskItem task)
    {
        if (task.Tags.Count == 0) return string.Empty;

        var tags = task.Tags
            .Select(t => "#" + t.Name.ToLowerInvariant().Replace(" ", "-"))
            .ToList();

        return " " + string.Join(" ", tags);
    }

    private static string BuildPomodorosPart(TaskItem task)
    {
        if (task.EstimatedPomodoros <= 0) return string.Empty;
        return $" 🍅 {task.CompletedPomodoros}/{task.EstimatedPomodoros}";
    }
}
