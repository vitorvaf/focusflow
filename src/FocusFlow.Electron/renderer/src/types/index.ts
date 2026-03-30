export type TaskStatus = 'Backlog' | 'Todo' | 'InProgress' | 'Done' | 'Archived';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type PomodoroType = 'Focus' | 'ShortBreak' | 'LongBreak';
export type TimerState = 'Idle' | 'Focus' | 'ShortBreak' | 'LongBreak' | 'Paused';

export interface BoardDto {
  id: number;
  name: string;
  vaultPath: string | null;
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
  boardId: number;
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

export interface CreateBoardRequest {
  name: string;
  vaultPath?: string;
}

export interface CreateTaskRequest {
  boardId: number;
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
  type: PomodoroType;
}
