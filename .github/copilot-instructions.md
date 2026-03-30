# FocusFlow — Copilot Instructions

## Project Overview

FocusFlow is a desktop productivity app combining a Pomodoro timer with Kanban task management, synchronized with Obsidian vaults via Markdown files. The app runs as an Electron shell hosting a React frontend, backed by a .NET 8 Web API with SQLite storage.

## Architecture

- **Frontend**: Electron 28+ with React 18, TypeScript 5, Vite, Tailwind CSS
- **Backend**: .NET 8 Web API (C#), EF Core 8 with SQLite, SignalR for real-time
- **Database**: SQLite — single source of truth; Obsidian `.md` files are derived outputs
- **Communication**: Electron → .NET API via HTTP on `localhost:5111`; real-time via SignalR

## Project Structure

```
FocusFlow/
├── src/
│   ├── FocusFlow.Api/           # .NET 8 Web API
│   │   ├── Controllers/         # REST endpoints
│   │   ├── Services/            # Business logic
│   │   ├── Models/              # EF Core entities and enums
│   │   ├── Data/                # DbContext and migrations
│   │   └── Hubs/                # SignalR hubs
│   └── FocusFlow.Electron/      # Electron + React
│       ├── main/                # Electron main process
│       └── renderer/src/        # React app
│           ├── components/      # React components
│           ├── hooks/           # Custom React hooks
│           ├── services/        # API client layer
│           └── types/           # TypeScript type definitions
└── tests/
    └── FocusFlow.Api.Tests/     # xUnit tests
```

## Key Conventions

### C# / .NET

- Target .NET 8. Use nullable reference types (`<Nullable>enable</Nullable>`).
- Always use `async/await` for I/O operations. Never use `.Result` or `.Wait()`.
- EF Core queries: use `AsNoTracking()` for read-only operations.
- XML doc comments on all public methods, including `<param>` and `<returns>`.
- Naming: PascalCase for public members, `_camelCase` for private fields.
- Inject dependencies via constructor. Never use service locator pattern.
- Models use data annotations AND Fluent API for EF Core configuration.
- Return `ActionResult<T>` from controller methods, never plain types.

### TypeScript / React

- Strict TypeScript: no `any`, no `as` casts unless truly necessary.
- Functional components only. State via `useState` and `useReducer`.
- Custom hooks in `hooks/` folder, prefixed with `use` (e.g., `usePomodoro`).
- All API calls go through the `services/api.ts` wrapper — never call `fetch` directly in components.
- Props interfaces named as `{ComponentName}Props`.
- Use Tailwind CSS for styling. No inline style objects unless dynamic.

### General

- Variable names and code comments in English.
- UI text (labels, messages, tooltips) in Portuguese (pt-BR).
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Every feature branch needs tests before merging.

## Data Model (key entities)

- `Board`: id, name, vaultPath, timestamps
- `TaskItem`: id, boardId, title, description, status (enum: Backlog/Todo/InProgress/Done/Archived), priority (enum), estimatedPomodoros, completedPomodoros, sortOrder, timestamps
- `PomodoroSession`: id, taskId, startedAt, endedAt, durationMinutes, type (enum: Focus/ShortBreak/LongBreak), completed (bool)
- `Tag`: id, name, color — many-to-many with TaskItem via `TaskTag` join table

## Obsidian Sync Rules

The `ObsidianSyncService` generates Kanban Markdown files for the Obsidian Kanban plugin:
- Frontmatter must include `kanban-plugin: basic`
- Columns are `## Heading` (Backlog, A Fazer, Em Progresso, Concluído)
- Pending tasks: `- [ ] Title #tag 🍅 completed/estimated`
- Done tasks: `- [x] Title #tag ✅ YYYY-MM-DD`
- Write atomically: write `.tmp` then rename
- Sync triggers after every task mutation

## Error Handling

- Backend: use `ProblemDetails` for error responses (RFC 7807).
- Frontend: every API call must have try/catch with user-friendly toast notifications.
- Never swallow exceptions silently.

## Build & Run Commands

```bash
# Backend
cd src/FocusFlow.Api
dotnet restore
dotnet build
dotnet run                              # Starts on localhost:5111

# Frontend
cd src/FocusFlow.Electron
npm install
npm run dev                             # Vite dev server

# Tests
cd tests/FocusFlow.Api.Tests
dotnet test

# EF Migrations
cd src/FocusFlow.Api
dotnet ef migrations add <MigrationName>
dotnet ef database update
```
