---
agent: 'agent'
description: 'Scaffold a new React component with TypeScript types, Tailwind styling, and optional hook'
tools: ['search/codebase', 'editfiles']
---

# Scaffold New React Component

Create a new React component for the FocusFlow Electron frontend.

**Component name**: ${input:componentName:Component name in PascalCase (e.g., TaskForm, TimerDisplay)}
**Location**: ${input:location:Folder inside components/ (e.g., TaskBoard, PomodoroTimer, Settings)}
**Needs custom hook?**: ${input:needsHook:yes or no}

## Steps

1. Create `src/FocusFlow.Electron/renderer/src/components/${input:location}/${input:componentName}.tsx`:
   - Define `${input:componentName}Props` interface with explicit types
   - Functional component with default export
   - Tailwind CSS for styling
   - Handle loading and error states if the component fetches data
   - All user-facing text in Portuguese (pt-BR)

2. If ${input:needsHook} is "yes", create `src/FocusFlow.Electron/renderer/src/hooks/use${input:componentName}.ts`:
   - Extract data fetching and state logic into the hook
   - Use `useState`, `useEffect`, `useCallback` as appropriate
   - Return a typed object (never a tuple for complex state)
   - All API calls through `services/api.ts`

3. Add TypeScript types to `src/FocusFlow.Electron/renderer/src/types/index.ts` if new DTOs are needed

4. Create test file `src/FocusFlow.Electron/renderer/src/components/${input:location}/${input:componentName}.test.tsx`:
   - Use Vitest + React Testing Library
   - Test rendering, user interactions, and edge cases

## Rules

- No `any` types
- No inline styles — use Tailwind classes
- No direct `fetch` calls — use `services/api.ts`
- Component file must have ONLY one exported component
