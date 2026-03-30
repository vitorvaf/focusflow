# FocusFlow — Agent Instructions

This file provides context for any AI coding agent working on the FocusFlow project.

## Project Summary

FocusFlow is a desktop Pomodoro + Kanban productivity app. It manages tasks in a board, runs a Pomodoro timer, and synchronizes the board to Obsidian vaults as Kanban-plugin-compatible Markdown files.

**Tech stack**: Electron (React + TypeScript) frontend, .NET 8 Web API backend, SQLite database, SignalR for real-time communication.

## Critical Rules

1. **SQLite is the source of truth.** Obsidian `.md` files are derived outputs, never inputs.
2. **Every task mutation triggers Obsidian sync.** If you add or modify code in any service that changes a `TaskItem`, you MUST call `await _sync.SyncBoardToVault(boardId)`.
3. **Async everywhere.** All I/O operations use `async/await`. Never `.Result` or `.Wait()`.
4. **No `any` in TypeScript.** Everything must be explicitly typed.
5. **UI text in Portuguese (pt-BR).** Code identifiers and comments in English.
6. **Atomic file writes for Obsidian.** Always write to `.tmp` then rename.

## How to Build

```bash
# Backend
cd src/FocusFlow.Api && dotnet build

# Frontend
cd src/FocusFlow.Electron && npm run build

# Tests
cd tests/FocusFlow.Api.Tests && dotnet test
cd src/FocusFlow.Electron && npm run test
```

## How to Run

```bash
# Start backend API (must be running before Electron)
cd src/FocusFlow.Api && dotnet run
# API will be available at http://localhost:5111

# Start Electron app (in a separate terminal)
cd src/FocusFlow.Electron && npm run dev
```

## Key Files

| File | Purpose |
|------|---------|
| `src/FocusFlow.Api/Data/AppDbContext.cs` | Database schema and configuration |
| `src/FocusFlow.Api/Services/ObsidianSyncService.cs` | Generates Kanban Markdown from SQLite data |
| `src/FocusFlow.Api/Services/PomodoroService.cs` | Timer state machine and session tracking |
| `src/FocusFlow.Api/Hubs/TimerHub.cs` | SignalR hub for real-time timer updates |
| `src/FocusFlow.Electron/main/main.ts` | Electron main process, manages .NET lifecycle |
| `src/FocusFlow.Electron/renderer/src/services/api.ts` | Frontend HTTP client for all API calls |

## Commit Convention

Follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

Example: `feat: add tag filtering to kanban board`
