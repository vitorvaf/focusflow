import { useState, useCallback, useEffect, useRef } from 'react';
import { pomodoroApi } from '../services/api';
import type { PomodoroStatusDto, PomodoroType } from '../types';
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
  const [error, setError] = useState<string | null>(null);
  const { on, off } = useSignalR();
  const onTaskUpdatedRef = useRef(onTaskUpdated);
  onTaskUpdatedRef.current = onTaskUpdated;

  // Sync initial state from server
  useEffect(() => {
    pomodoroApi.getStatus()
      .then(setStatus)
      .catch(() => { /* backend might not be running */ });
  }, []);

  // Subscribe to SignalR events
  useEffect(() => {
    const handleTick = (payload: unknown) => {
      const p = payload as TimerTickPayload;
      setStatus(prev => ({
        ...prev,
        remainingSeconds: p.remainingSeconds,
        totalSeconds: p.totalSeconds,
      }));
    };

    const handleComplete = (payload: unknown) => {
      const p = payload as TimerCompletePayload;
      setStatus(prev => ({ ...prev, state: 'Idle', type: null, remainingSeconds: 0, totalSeconds: 0, sessionId: null, taskId: p.taskId ?? prev.taskId }));
    };

    const handleTaskUpdated = (payload: unknown) => {
      const p = payload as { taskId: number };
      onTaskUpdatedRef.current?.(p.taskId);
    };

    on('TimerTick', handleTick);
    on('TimerComplete', handleComplete);
    on('TaskUpdated', handleTaskUpdated);

    return () => {
      off('TimerTick', handleTick);
      off('TimerComplete', handleComplete);
      off('TaskUpdated', handleTaskUpdated);
    };
  }, [on, off]);

  const start = useCallback(async (taskId: number, type: PomodoroType) => {
    try {
      setError(null);
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

  return { status, error, start, pause, resume, stop };
}
