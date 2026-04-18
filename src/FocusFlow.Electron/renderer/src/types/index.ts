export type TaskStatus = 'Backlog' | 'Todo' | 'InProgress' | 'Done' | 'Archived';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type PomodoroType = 'Focus' | 'ShortBreak' | 'LongBreak';
export type TimerState = 'Idle' | 'Focus' | 'ShortBreak' | 'LongBreak' | 'Paused';

export interface ProjectDto {
  id: number;
  name: string;
  vaultPath: string | null;
  color: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagDto {
  id: number;
  name: string;
  color: string;
}

export interface TaskItemDto {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  sortOrder: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagDto[];
}

export interface PomodoroSessionDto {
  id: number;
  taskId: number;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  type: PomodoroType;
  completed: boolean;
}

export interface PomodoroStatusDto {
  state: TimerState;
  type: PomodoroType | null;
  taskId: number | null;
  projectId: number | null;
  remainingSeconds: number;
  totalSeconds: number;
  sessionId: number | null;
}

export interface PomodoroStatsDto {
  todayFocusSessions: number;
  weekFocusSessions: number;
  totalFocusSessions: number;
  todayFocusMinutes: number;
}

export interface AppSettingsDto {
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  darkMode: boolean;
  vaultPath: string;
}

export interface CreateProjectRequest {
  name: string;
  vaultPath?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  vaultPath?: string;
  color?: string;
}

export interface DeleteProjectRequest {
  targetProjectId?: number;
}

export interface CreateTaskRequest {
  projectId: number;
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedPomodoros?: number;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  estimatedPomodoros?: number;
  dueDate?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface ReorderTaskRequest {
  sortOrder: number;
}

export interface StartPomodoroRequest {
  taskId: number;
  projectId: number;
  type: PomodoroType;
}
