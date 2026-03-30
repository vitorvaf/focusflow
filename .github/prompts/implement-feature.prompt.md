---
agent: 'agent'
description: 'Implement a complete feature across backend, frontend, and Obsidian sync'
tools: ['search/codebase', 'readfile', 'editfiles', 'terminal', 'find_references']
---

# Implement Feature End-to-End

Implement a complete feature for FocusFlow spanning all layers.

**Feature description**: ${input:feature:Describe the feature to implement}
**Affected area**: ${input:area:backend-only, frontend-only, or full-stack}

## Implementation Workflow

### 1. Analyze
- Search the codebase for related existing code
- Identify all files that need to change
- Check if new database entities or migrations are needed

### 2. Backend (if applicable)
- Models and migrations first
- DTOs (request + response)
- Service with business logic (don't forget Obsidian sync after mutations)
- Controller endpoint
- Register new services in `Program.cs`
- Run: `cd src/FocusFlow.Api && dotnet build`

### 3. Frontend (if applicable)
- TypeScript types mirroring backend DTOs
- API client methods in `services/api.ts`
- Custom hook if complex state management is needed
- React component(s) with Tailwind styling
- UI text in Portuguese (pt-BR)
- Run: `cd src/FocusFlow.Electron && npm run build`

### 4. Tests
- Backend: xUnit test for the new service method(s)
- Frontend: Vitest test for new component(s)
- Run all: `dotnet test && npm run test`

### 5. Verify
- Confirm the build passes on both sides
- List all files created or modified
- Note any manual steps needed (e.g., running migrations)

## Constraints
- Follow conventions in copilot-instructions.md
- No new packages without justification
- Keep the PR focused on this single feature
