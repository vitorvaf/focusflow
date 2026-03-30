import type {
  BoardDto,
  CreateBoardRequest,
  TaskItemDto,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  ReorderTaskRequest,
  PomodoroSessionDto,
  PomodoroStatusDto,
  PomodoroStatsDto,
  StartPomodoroRequest,
} from '../types';

const API_BASE = 'http://localhost:5111/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const boardsApi = {
  list: () =>
    request<BoardDto[]>('/boards'),
  getById: (id: number) =>
    request<BoardDto>(`/boards/${id}`),
  create: (data: CreateBoardRequest) =>
    request<BoardDto>('/boards', { method: 'POST', body: JSON.stringify(data) }),
  sync: (id: number) =>
    request<void>(`/boards/${id}/sync`, { method: 'POST' }),
  restore: (id: number) =>
    request<void>(`/boards/${id}/restore`, { method: 'POST' }),
};

export const tasksApi = {
  list: (boardId: number, status?: string) => {
    const qs = status ? `?boardId=${boardId}&status=${status}` : `?boardId=${boardId}`;
    return request<TaskItemDto[]>(`/tasks${qs}`);
  },
  getById: (id: number) =>
    request<TaskItemDto>(`/tasks/${id}`),
  create: (data: CreateTaskRequest) =>
    request<TaskItemDto>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTaskRequest) =>
    request<TaskItemDto>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: number, data: UpdateTaskStatusRequest) =>
    request<TaskItemDto>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  reorder: (id: number, data: ReorderTaskRequest) =>
    request<TaskItemDto>(`/tasks/${id}/reorder`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const pomodoroApi = {
  start: (data: StartPomodoroRequest) =>
    request<PomodoroStatusDto>('/pomodoro/start', { method: 'POST', body: JSON.stringify(data) }),
  pause: () =>
    request<PomodoroStatusDto>('/pomodoro/pause', { method: 'POST' }),
  resume: () =>
    request<PomodoroStatusDto>('/pomodoro/resume', { method: 'POST' }),
  stop: () =>
    request<PomodoroStatusDto>('/pomodoro/stop', { method: 'POST' }),
  getStatus: () =>
    request<PomodoroStatusDto>('/pomodoro/status'),
  getHistory: (taskId?: number, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (taskId !== undefined) params.set('taskId', String(taskId));
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.size > 0 ? `?${params.toString()}` : '';
    return request<PomodoroSessionDto[]>(`/pomodoro/history${qs}`);
  },
  getStats: () =>
    request<PomodoroStatsDto>('/pomodoro/stats'),
};

export const settingsApi = {
  get: (key: string) =>
    request<{ key: string; value: string }>(`/settings/${key}`),
  update: (key: string, value: string) =>
    request<void>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};
