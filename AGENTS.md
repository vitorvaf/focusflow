# FocusFlow — Agent Instructions (Optimized for Opencode)

This file provides the comprehensive context, rules, and standards for Opencode to operate efficiently on the FocusFlow project.

## 🏗 Project Overview

FocusFlow is a desktop productivity app combining a **Pomodoro timer** with **Kanban task management**, synchronized with **Obsidian vaults** via Markdown files.

- **Frontend**: Electron 28+ with React 18, TypeScript 5, Vite, Tailwind CSS.
- **Backend**: .NET 8 Web API (C#), EF Core 8 with SQLite, SignalR for real-time.
- **Database**: SQLite is the **single source of truth**. Obsidian `.md` files are derived outputs.

---

## 📂 Project Structure

- `src/FocusFlow.Api/`: .NET 8 Web API
  - `Controllers/`: REST endpoints
  - `Services/`: Business logic (Sync, Timer, etc.)
  - `Models/`: EF Core entities and enums
  - `Data/`: DbContext and migrations
  - `Hubs/`: SignalR hubs
- `src/FocusFlow.Electron/`: Electron + React
  - `main/`: Electron main process (manages .NET process)
  - `renderer/src/`: React application
    - `components/`: React components (Atomic design preferred)
    - `hooks/`: Custom React hooks (e.g., `usePomodoro`)
    - `services/`: API client layer (`api.ts` wrapper)
    - `types/`: TypeScript type definitions
- `tests/FocusFlow.Api.Tests/`: xUnit tests for the backend.

---

## 📏 Critical Rules & Conventions

### 🛠 General
- **Variable names & Comments**: English.
- **UI Text**: Portuguese (pt-BR).
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- **Obsidian Sync**: Every task mutation MUST trigger `await _sync.SyncBoardToVault(boardId)`.

### 🖥 C# / .NET 8
- **Async/Await**: Mandatory for all I/O. Never use `.Result` or `.Wait()`.
- **EF Core**: Use `AsNoTracking()` for read-only operations.
- **Dependency Injection**: Use constructor injection only.
- **Naming**: `PascalCase` for public, `_camelCase` for private fields.
- **Documentation**: XML doc comments on all public methods.

### ⚛️ TypeScript / React
- **Strict Typing**: No `any`. Use explicit interfaces/types.
- **Components**: Functional components only.
- **API Calls**: Must use `services/api.ts`. Never call `fetch` directly in components.
- **Styling**: Tailwind CSS. Avoid inline styles.

---

## 🚀 Key Commands

### Build
- **Backend**: `cd src/FocusFlow.Api && dotnet build`
- **Frontend**: `cd src/FocusFlow.Electron && npm run build`
- **Tests**: 
  - Backend: `cd tests/FocusFlow.Api.Tests && dotnet test`
  - Frontend: `cd src/FocusFlow.Electron && npm run test`

### Run
- **Backend API**: `cd src/FocusFlow.Api && dotnet run` (Starts on `http://localhost:5111`)
- **Electron app**: `cd src/FocusFlow.Electron && npm run dev`

---

## 🧩 External File Loading
CRITICAL: When you encounter a file reference (e.g., `@rules/backend.md`), use your Read tool to load it.
- Follow `.github/copilot-instructions.md` for additional historical context if needed.
- Refer to `package.json` and `*.csproj` for dependency management.
