---
agent: 'agent'
description: 'Scaffold a new REST API endpoint end-to-end: model, DTO, service, controller, and migration'
tools: ['search/codebase', 'editfiles', 'terminal']
---

# Scaffold New API Endpoint

Create a new API endpoint for the FocusFlow .NET 8 backend.

**Entity name**: ${input:entityName:Entity name in PascalCase (e.g., Tag, Category)}
**Operations**: ${input:operations:Which operations? (e.g., CRUD, Read-only, Create+Read)}

## Steps

1. Create the entity model in `src/FocusFlow.Api/Models/${input:entityName}.cs`
   - Include Id (int, PK), timestamps (CreatedAt, UpdatedAt), and relevant fields
   - Add navigation properties if relationships exist

2. Update `AppDbContext` in `src/FocusFlow.Api/Data/AppDbContext.cs`
   - Add `DbSet<${input:entityName}>`
   - Add Fluent API config if needed

3. Create EF Core migration:
   ```bash
   cd src/FocusFlow.Api && dotnet ef migrations add Add${input:entityName}Table
   ```

4. Create DTOs in `src/FocusFlow.Api/Models/`:
   - `${input:entityName}Dto.cs` (response)
   - `Create${input:entityName}Request.cs` (create input)
   - `Update${input:entityName}Request.cs` (update input, if applicable)

5. Create service in `src/FocusFlow.Api/Services/${input:entityName}Service.cs`
   - Inject `AppDbContext` and `ObsidianSyncService`
   - Implement requested operations with async/await
   - Trigger Obsidian sync after mutations if the entity affects the board

6. Create controller in `src/FocusFlow.Api/Controllers/${input:entityName}sController.cs`
   - Route: `api/{entityName}s` (lowercase, plural)
   - Return `ActionResult<T>` for all methods
   - Use `[FromBody]` for POST/PUT, `[FromRoute]` for ids

7. Register service in `Program.cs`:
   ```csharp
   builder.Services.AddScoped<${input:entityName}Service>();
   ```

8. Verify build: `dotnet build`

Follow all conventions from the project's copilot-instructions.md.
