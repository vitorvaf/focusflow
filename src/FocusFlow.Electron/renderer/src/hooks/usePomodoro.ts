import { useState, useCallback, useEffect, useRef } from 'react';
import { pomodoroApi, tasksApi } from '../services/api';
import type { PomodoroStatusDto, PomodoroType, TimerState, TaskItemDto } from '../types';
import { useSignalR } from './useSignalR';

interface TimerTickPayload {
  remainingSeconds: number;
  totalSeconds: number;
  type: string;
}

interface TimerCompletePayload {
  type: string;
  taskId: number | null;
}

export interface PomodoroTaskInfo {
  taskTitle: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
}

function playCompletionSound(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.25);
      gain.gain.setValueAtTime(0.25, now + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.8);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.8);
    });

    setTimeout(() => void ctx.close(), 2500);
  } catch (err) {
    console.warn('[Pomodoro] Web Audio API não disponível:', err);
  }
}

function getCompletionMessage(type: string): { title: string; body: string } {
  switch (type) {
    case 'Focus':
      return {
        title: 'Pomodoro Concluído!',
        body: 'Ótimo trabalho! Hora de fazer uma pausa.',
      };
    case 'ShortBreak':
      return {
        title: 'Pausa Curta Concluída',
        body: 'Descansado? Vamos focar novamente!',
      };
    case 'LongBreak':
      return {
        title: 'Pausa Longa Concluída',
        body: 'Recarregado! Pronto para mais pomodoros?',
      };
    default:
      return { title: 'FocusFlow', body: 'Sessão concluída.' };
  }
}

export function usePomodoro() {
  const [status, setStatus] = useState<PomodoroStatusDto>({
    state: 'Idle',
    type: null,
    taskId: null,
    projectId: null,
    remainingSeconds: 0,
    totalSeconds: 0,
    sessionId: null,
  });
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [taskInfo, setTaskInfo] = useState<PomodoroTaskInfo>({
    taskTitle: null,
    estimatedPomodoros: 0,
    completedPomodoros: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const { on, off } = useSignalR();

  const refresh = useCallback(async (projectId: number) => {
    try {
      const [statusData, tasksData] = await Promise.all([
        pomodoroApi.getStatus(),
        tasksApi.list(projectId),
      ]);
      setStatus(statusData);
      setTasks(tasksData);
      setCurrentProjectId(projectId);
    } catch (err) {
      console.warn('[Pomodoro] Erro ao carregar dados:', err);
    }
  }, []);

  useEffect(() => {
    pomodoroApi.getStatus()
      .then(s => {
        setStatus(s);
        if (s.projectId) {
          setCurrentProjectId(s.projectId);
          tasksApi.list(s.projectId).then(setTasks).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const taskId = status.taskId;
    if (!taskId) {
      setTaskInfo({ taskTitle: null, estimatedPomodoros: 0, completedPomodoros: 0 });
      return;
    }
    tasksApi.getById(taskId)
      .then(task => {
        setTaskInfo({
          taskTitle:          task.title,
          estimatedPomodoros: task.estimatedPomodoros,
          completedPomodoros: task.completedPomodoros,
        });
      })
      .catch(() => {});
  }, [status.taskId]);

  const refreshTaskInfo = useCallback((taskId: number) => {
    tasksApi.getById(taskId)
      .then(task => {
        setTaskInfo({
          taskTitle:          task.title,
          estimatedPomodoros: task.estimatedPomodoros,
          completedPomodoros: task.completedPomodoros,
        });
        setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleTick = (payload: unknown) => {
      const p = payload as TimerTickPayload;
      const timerState = p.type as TimerState;
      setStatus(prev => ({
        ...prev,
        state: timerState,
        type: timerState as PomodoroType,
        remainingSeconds: p.remainingSeconds,
        totalSeconds: p.totalSeconds,
      }));
    };

    const handleComplete = (payload: unknown) => {
      const p = payload as TimerCompletePayload;

      setStatus(prev => ({
        ...prev,
        state: 'Idle',
        type: null,
        remainingSeconds: 0,
        totalSeconds: 0,
        sessionId: null,
        taskId: p.taskId ?? prev.taskId,
      }));

      playCompletionSound();

      const { title, body } = getCompletionMessage(p.type);

      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.showNotification(title, body);
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    };

    const handleTaskUpdated = (payload: unknown) => {
      const p = payload as { taskId: number };
      refreshTaskInfo(p.taskId);
    };

    on('TimerTick', handleTick);
    on('TimerComplete', handleComplete);
    on('TaskUpdated', handleTaskUpdated);

    return () => {
      off('TimerTick', handleTick);
      off('TimerComplete', handleComplete);
      off('TaskUpdated', handleTaskUpdated);
    };
  }, [on, off, refreshTaskInfo]);

  const start = useCallback(async (taskId: number, projectId: number, type: PomodoroType) => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.start({ taskId, projectId, type });
      setStatus(newStatus);
      setCurrentProjectId(projectId);
      tasksApi.list(projectId).then(setTasks).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.pause();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pausar');
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.resume();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao retomar');
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.stop();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao parar');
    }
  }, []);

  const skip = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.stop();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pular pausa');
    }
  }, []);

  return { status, tasks, taskInfo, error, start, pause, resume, stop, skip, refresh };
}
