import { useState, useCallback, useEffect } from 'react';
import { tasksApi } from '../services/api';
import { ApiError } from '../services/api';
import type { TaskItemDto, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../types';

/** Full CRUD task management with optimistic updates. */
export function useTasks(boardId: number) {
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.list(boardId);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const create = useCallback(async (data: CreateTaskRequest) => {
    try {
      const created = await tasksApi.create(data);
      setTasks(prev => [...prev, created]);
      return created;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar tarefa';
      setError(msg);
      throw err;
    }
  }, []);

  const update = useCallback(async (id: number, data: UpdateTaskRequest) => {
    const previous = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    try {
      const updated = await tasksApi.update(id, data);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      if (previous) setTasks(prev => prev.map(t => t.id === id ? previous : t));
      const msg = err instanceof ApiError ? err.message : 'Erro ao atualizar tarefa';
      setError(msg);
      throw err;
    }
  }, [tasks]);

  const updateStatus = useCallback(async (id: number, status: TaskStatus) => {
    const previous = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      const updated = await tasksApi.updateStatus(id, { status });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      if (previous) setTasks(prev => prev.map(t => t.id === id ? previous : t));
      const msg = err instanceof ApiError ? err.message : 'Erro ao mover tarefa';
      setError(msg);
      throw err;
    }
  }, [tasks]);

  const reorder = useCallback(async (id: number, sortOrder: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, sortOrder } : t));
    try {
      await tasksApi.reorder(id, { sortOrder });
    } catch (err) {
      void fetchTasks(); // Revert by refetching
      const msg = err instanceof ApiError ? err.message : 'Erro ao reordenar tarefa';
      setError(msg);
    }
  }, [fetchTasks]);

  const remove = useCallback(async (id: number) => {
    const previous = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await tasksApi.delete(id);
    } catch (err) {
      setTasks(previous);
      const msg = err instanceof ApiError ? err.message : 'Erro ao remover tarefa';
      setError(msg);
      throw err;
    }
  }, [tasks]);

  const refreshTask = useCallback((taskId: number) => {
    tasksApi.getById(taskId)
      .then(updated => setTasks(prev => prev.map(t => t.id === taskId ? updated : t)))
      .catch(() => { /* best-effort */ });
  }, []);

  return { tasks, loading, error, refetch: fetchTasks, create, update, updateStatus, reorder, remove, refreshTask };
}
