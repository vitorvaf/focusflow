---
applyTo: "src/FocusFlow.Api/**/*.cs"
---

# C# / .NET Backend Instructions

## Controller Pattern

Controllers are thin — delegate logic to services:

```csharp
// ✅ Good
[HttpPost]
public async Task<ActionResult<TaskItemDto>> Create([FromBody] CreateTaskRequest request)
{
    var result = await _taskService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
}

// ❌ Bad — business logic in controller
[HttpPost]
public async Task<ActionResult<TaskItemDto>> Create([FromBody] CreateTaskRequest request)
{
    var entity = new TaskItem { Title = request.Title };
    _db.Tasks.Add(entity);
    await _db.SaveChangesAsync();
    // ...sync obsidian here... NO!
}
```

## Service Pattern

Services contain business logic and coordinate side effects:

```csharp
public class TaskService
{
    private readonly AppDbContext _db;
    private readonly ObsidianSyncService _sync;

    // Always inject via constructor
    public TaskService(AppDbContext db, ObsidianSyncService sync)
    {
        _db = db;
        _sync = sync;
    }

    public async Task<TaskItemDto> CreateAsync(CreateTaskRequest request)
    {
        var entity = request.ToEntity();
        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync();
        await _sync.SyncBoardToVault(entity.BoardId); // Always sync after mutation
        return entity.ToDto();
    }
}
```

## EF Core Conventions

- DbContext registered as Scoped (default). Never inject into singletons.
- Use `Include()` explicitly — no lazy loading.
- Read-only queries use `AsNoTracking()`.
- Migrations: one migration per feature, descriptive names like `AddPomodoroSessionTable`.

## DTOs and Mapping

- Never expose EF entities directly to the API. Use DTOs.
- Map with extension methods `ToDto()` and `ToEntity()` in a static `Mappings` class.
- Request DTOs: `Create{Entity}Request`, `Update{Entity}Request`.
- Response DTOs: `{Entity}Dto`.

## Dependency Injection Registration

Register services in `Program.cs` grouped by layer:

```csharp
// Data
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connectionString));

// Services
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<PomodoroService>();
builder.Services.AddScoped<ObsidianSyncService>();

// SignalR
builder.Services.AddSignalR();
```

## Error Handling

Use `ProblemDetails` responses. For validation, return 400. For not found, return 404:

```csharp
if (task is null)
    return NotFound(new ProblemDetails { Title = "Task not found", Status = 404 });
```
