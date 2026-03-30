---
applyTo: "src/FocusFlow.Electron/renderer/**/*.{ts,tsx}"
---

# TypeScript / React Frontend Instructions

## Component Structure

Functional components with explicit typing. One component per file:

```tsx
// ✅ Good
interface TaskCardProps {
  task: TaskItemDto;
  onMove: (taskId: number, newStatus: TaskStatus) => void;
  onSelect: (taskId: number) => void;
}

export function TaskCard({ task, onMove, onSelect }: TaskCardProps) {
  return (
    <div className="rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-medium text-sm">{task.title}</h3>
      {/* ... */}
    </div>
  );
}
```

## Custom Hooks

Extract reusable logic into hooks. Hooks must:
- Live in `hooks/` folder
- Start with `use`
- Return typed objects, never tuples for complex state

```tsx
// ✅ Good
export function usePomodoro(taskId: number) {
  const [state, setState] = useState<PomodoroState>({ status: 'idle', remaining: 0 });

  const start = useCallback(async () => { /* ... */ }, [taskId]);
  const pause = useCallback(async () => { /* ... */ }, []);

  return { state, start, pause };
}
```

## API Service Layer

All HTTP calls through `services/api.ts`. Use a typed client:

```tsx
// services/api.ts
const API_BASE = 'http://localhost:5111/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return response.json();
}

export const tasksApi = {
  list: (boardId: number) => request<TaskItemDto[]>(`/tasks?boardId=${boardId}`),
  create: (data: CreateTaskRequest) => request<TaskItemDto>('/tasks', {
    method: 'POST', body: JSON.stringify(data)
  }),
  // ...
};
```

## State Management

- Local component state: `useState`
- Complex component state: `useReducer`
- Cross-component state: React Context with custom provider hooks
- No Redux — the app is small enough for Context + hooks

## Drag and Drop

Use `@dnd-kit/core` and `@dnd-kit/sortable` for Kanban board:
- `SortableContext` per column
- `DndContext` wrapping the whole board
- On drag end: update local state optimistically, then call API, rollback on error

## Styling

- Tailwind CSS utility classes. No CSS files except `global.css` for base styles.
- Dark mode: use `dark:` variant classes. Theme toggle in settings.
- Consistent spacing: `p-2`, `p-3`, `p-4`. Consistent rounding: `rounded-lg`.

## SignalR Connection

```tsx
// hooks/useSignalR.ts
export function useSignalR() {
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl('http://localhost:5111/timer-hub')
      .withAutomaticReconnect()
      .build();

    conn.start();
    connectionRef.current = conn;

    return () => { conn.stop(); };
  }, []);

  return connectionRef;
}
```

## UI Text

All user-facing text in Portuguese (pt-BR). Code identifiers in English:

```tsx
// ✅ Good
<Button onClick={handleStart}>Iniciar Foco</Button>
<span className="text-muted">Pomodoro {completedPomodoros} de {estimatedPomodoros}</span>

// ❌ Bad — English UI text
<Button onClick={handleStart}>Start Focus</Button>
```
