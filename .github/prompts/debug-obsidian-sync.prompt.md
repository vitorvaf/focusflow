---
agent: 'agent'
description: 'Debug or update the Obsidian Kanban Markdown sync logic'
tools: ['search/codebase', 'readfile', 'editfiles', 'terminal']
---

# Debug/Update Obsidian Sync

Inspect and fix the ObsidianSyncService that generates Kanban-format Markdown for the Obsidian Kanban plugin.

**Issue or change**: ${input:issue:Describe the problem or the change needed}

## Expected Kanban Markdown Format

The generated `.md` file MUST follow this exact structure:

```markdown
---
kanban-plugin: basic
---

## Backlog

- [ ] Task title #tag 🍅 0/3

## A Fazer

- [ ] Task title #tag

## Em Progresso

- [ ] Task title #tag 🍅 2/5

## Concluído

- [x] Task title #tag ✅ 2025-03-28

%% kanban:settings
\```json
{"kanban-plugin":"basic","list-collapse":[false,false,false,false]}
\```
%%
```

## Debugging Steps

1. Read `src/FocusFlow.Api/Services/ObsidianSyncService.cs`
2. Check the `GenerateKanbanMarkdown` method against the expected format above
3. Verify:
   - Frontmatter has `kanban-plugin: basic`
   - Column headings are exactly: Backlog, A Fazer, Em Progresso, Concluído
   - Pending tasks use `- [ ]`, done tasks use `- [x]`
   - Tags appear as `#tagname` (no spaces in tag, lowercase)
   - Pomodoro indicator: `🍅 {completed}/{estimated}` (only if estimated > 0)
   - Completion date: `✅ YYYY-MM-DD` (only for Done tasks)
   - Settings block at the end with `%% kanban:settings` wrapper
   - File write is atomic: write to `.tmp` then `File.Move` with overwrite
4. Apply the fix for: ${input:issue}
5. Run tests: `cd tests/FocusFlow.Api.Tests && dotnet test --filter ObsidianSync`
