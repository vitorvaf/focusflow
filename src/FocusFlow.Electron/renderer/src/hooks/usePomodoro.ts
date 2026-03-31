import { useState, useCallback, useEffect, useRef } from 'react';
import { pomodoroApi, tasksApi } from '../services/api';
import type { PomodoroStatusDto, PomodoroType, TimerState } from '../types';
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

/** Extra task info exposed by the hook for the mini timer display. */
export interface PomodoroTaskInfo {
  taskTitle: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
}

/** Plays a short completion beep using the Web Audio API. */
function playCompletionSound(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Two-tone chime: high then slightly lower
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

    // Release AudioContext after sounds finish
    setTimeout(() => void ctx.close(), 2500);
  } catch (err) {
    console.warn('[Pomodoro] Web Audio API não disponível:', err);
  }
}

/** Returns notification title and body strings (pt-BR) for a completed session type. */
function getCompletionMessage(type: string): { title: string; body: string } {
  switch (type) {
    case 'Focus':
      return {
        title: '🍅 Pomodoro Concluído!',
        body: 'Ótimo trabalho! Hora de fazer uma pausa.',
      };
    case 'ShortBreak':
      return {
        title: '☕ Pausa Curta Concluída',
        body: 'Descansado? Vamos focar novamente!',
      };
    case 'LongBreak':
      return {
        title: '💪 Pausa Longa Concluída',
        body: 'Recarregado! Pronto para mais pomodoros?',
      };
    default:
      return { title: 'FocusFlow', body: 'Sessão concluída.' };
  }
}

/** Manages Pomodoro timer state, synced with the backend via REST + SignalR. */
export function usePomodoro(onTaskUpdated?: (taskId: number) => void) {
  const [status, setStatus] = useState<PomodoroStatusDto>({
    state: 'Idle',
    type: null,
    taskId: null,
    remainingSeconds: 0,
    totalSeconds: 0,
    sessionId: null,
  });
  const [taskInfo, setTaskInfo] = useState<PomodoroTaskInfo>({
    taskTitle: null,
    estimatedPomodoros: 0,
    completedPomodoros: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const { on, off } = useSignalR();
  const onTaskUpdatedRef = useRef(onTaskUpdated);
  onTaskUpdatedRef.current = onTaskUpdated;

  // Sync initial state from server
  useEffect(() => {
    console.log('[Pomodoro] Carregando estado inicial...');
    pomodoroApi.getStatus()
      .then(s => {
        console.log('[Pomodoro] Estado inicial:', s.state, s.remainingSeconds + 's');
        setStatus(s);
      })
      .catch(() => { /* backend might not be running in dev */ });
  }, []);

  // Fetch task details whenever taskId changes (for mini timer display)
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
      .catch(() => { /* task may not exist */ });
  }, [status.taskId]);

  // Also refresh task info when TaskUpdated event arrives (pomodoro count changed)
  const refreshTaskInfo = useCallback((taskId: number) => {
    tasksApi.getById(taskId)
      .then(task => {
        setTaskInfo({
          taskTitle:          task.title,
          estimatedPomodoros: task.estimatedPomodoros,
          completedPomodoros: task.completedPomodoros,
        });
      })
      .catch(() => { /* ignore */ });
  }, []);

  // Subscribe to SignalR events
  useEffect(() => {
    console.log('[Pomodoro] Registrando handlers SignalR...');

    const handleTick = (payload: unknown) => {
      const p = payload as TimerTickPayload;
      // Update state and type from the tick payload so auto-break is reflected in UI
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
      console.log('[Pomodoro] ✅ TimerComplete recebido — tipo:', p.type, '| taskId:', p.taskId);

      setStatus(prev => ({
        ...prev,
        state: 'Idle',
        type: null,
        remainingSeconds: 0,
        totalSeconds: 0,
        sessionId: null,
        taskId: p.taskId ?? prev.taskId,
      }));

      // Play audio feedback
      playCompletionSound();

      // Trigger system notification (Electron) or browser notification (web fallback)
      const { title, body } = getCompletionMessage(p.type);
      console.log('[Pomodoro] Enviando notificação:', title);

      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.showNotification(title, body);
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    };

    const handleTaskUpdated = (payload: unknown) => {
      const p = payload as { taskId: number };
      console.log('[Pomodoro] TaskUpdated — taskId:', p.taskId);
      onTaskUpdatedRef.current?.(p.taskId);
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

  const start = useCallback(async (taskId: number, type: PomodoroType) => {
    try {
      setError(null);
      console.log('[Pomodoro] Iniciando sessão — taskId:', taskId, '| tipo:', type);
      const newStatus = await pomodoroApi.start({ taskId, type });
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.pause();
      console.log('[Pomodoro] Pausado');
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pausar');
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.resume();
      console.log('[Pomodoro] Retomado');
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao retomar');
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.stop();
      console.log('[Pomodoro] Parado');
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao parar');
    }
  }, []);

  /** Skips the current break session (alias for stop during break states). */
  const skip = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await pomodoroApi.stop();
      console.log('[Pomodoro] Pausa pulada');
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pular pausa');
    }
  }, []);

  return { status, taskInfo, error, start, pause, resume, stop, skip };
}

