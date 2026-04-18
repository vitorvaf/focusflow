import { useEffect } from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { tasksApi } from '../../services/api';
import type { TaskItemDto } from '../../types';

interface PomodoroTimerProps {
  projectId: number;
  projectColor?: string;
  selectedTaskId: number | null;
  onSelectTask: (id: number | null) => void;
}

const CYCLE_SIZE = 4;

function cycleLabel(completedPomodoros: number): string {
  const position = (completedPomodoros % CYCLE_SIZE) + 1;
  return `${position}/${CYCLE_SIZE}`;
}

export function PomodoroTimer({ projectId, projectColor, selectedTaskId, onSelectTask }: PomodoroTimerProps) {
  const { status, tasks, error, start, pause, resume, stop, refresh } = usePomodoro();

  useEffect(() => {
    refresh(projectId);
  }, [projectId, refresh]);

  const activeTasks = tasks.filter(t => t.status !== 'Archived' && t.status !== 'Done');
  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

  const handleStart = async () => {
    const taskId = selectedTaskId ?? activeTasks[0]?.id;
    if (!taskId) return;
    await start(taskId, projectId, 'Focus');
  };

  const isIdle = status.state === 'Idle';
  const displayTaskId = status.taskId ?? selectedTaskId;
  const displayTask = tasks.find(t => t.id === displayTaskId) ?? null;

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-6">
      {projectColor && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: projectColor }}
          />
          <span>Timer do Projeto</span>
        </div>
      )}

      {isIdle && (
        <div className="w-full max-w-xs">
          <label className="block text-xs text-gray-400 mb-1">Tarefa</label>
          <select
            value={selectedTaskId ?? ''}
            onChange={e => onSelectTask(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecionar tarefa...</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      {displayTask && (
        <div className="text-center">
          <p className="text-sm text-gray-300 font-medium">{displayTask.title}</p>
          {displayTask.estimatedPomodoros > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              🍅 {cycleLabel(displayTask.completedPomodoros)} ({displayTask.completedPomodoros}/{displayTask.estimatedPomodoros} total)
            </p>
          )}
        </div>
      )}

      <TimerDisplay
        remainingSeconds={status.remainingSeconds}
        totalSeconds={status.totalSeconds}
        state={status.state}
        type={status.type}
      />

      <TimerControls
        state={status.state}
        onStart={handleStart}
        onPause={pause}
        onResume={resume}
        onStop={stop}
      />

      {isIdle && selectedTask && (
        <div className="flex gap-3">
          <button
            onClick={() => void start(selectedTask.id, projectId, 'ShortBreak')}
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
          >
            Iniciar Pausa Curta
          </button>
          <span className="text-gray-600">·</span>
          <button
            onClick={() => void start(selectedTask.id, projectId, 'LongBreak')}
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
          >
            Iniciar Pausa Longa
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
      )}

      {typeof window !== 'undefined' && window.electronAPI && (
        <button
          onClick={() => window.electronAPI?.toggleMiniTimer()}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors
                     flex items-center gap-1"
          title="Abrir modo compacto (Ctrl+Shift+M)"
        >
          <span>🗗</span> Mini Timer
        </button>
      )}
    </div>
  );
}
