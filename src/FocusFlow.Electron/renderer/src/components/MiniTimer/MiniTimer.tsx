import { useCallback } from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { MiniTimerDisplay }  from './MiniTimerDisplay';
import { MiniTimerControls } from './MiniTimerControls';
import { MiniTimerDragBar }  from './MiniTimerDragBar';
import type { PomodoroType } from '../../types';

const BG_BY_TYPE: Record<string, string> = {
  Focus:      'bg-red-950/60',
  ShortBreak: 'bg-emerald-950/60',
  LongBreak:  'bg-blue-950/60',
};

/**
 * Compact floating timer window component.
 * Loaded at route `/mini-timer` in a frameless, always-on-top BrowserWindow.
 */
export function MiniTimer() {
  const { status, taskInfo, start, pause, resume, stop, skip } = usePomodoro();

  const handleExpand = useCallback(() => {
    window.electronAPI?.expandFromMini();
  }, []);

  const handleStart = useCallback(() => {
    if (status.taskId) {
      void start(status.taskId, 'Focus');
    }
  }, [start, status.taskId]);

  const bg = status.type ? (BG_BY_TYPE[status.type] ?? 'bg-zinc-900') : 'bg-zinc-900';

  return (
    <div className={`h-screen w-screen select-none ${bg} rounded-xl overflow-hidden
                     flex flex-col text-zinc-100`}>
      {/* Draggable title bar */}
      <MiniTimerDragBar onExpand={handleExpand} />

      {/* Timer display + task info */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-1">
        <MiniTimerDisplay
          remainingSeconds={status.remainingSeconds}
          type={status.type}
        />

        <p className="text-xs text-zinc-400 truncate max-w-[290px] text-center mt-1">
          {taskInfo.taskTitle ?? 'Nenhuma tarefa selecionada'}
        </p>

        {/* Pomodoro progress dots */}
        {taskInfo.estimatedPomodoros > 0 && (
          <div className="flex gap-1 mt-1" title={`${taskInfo.completedPomodoros} de ${taskInfo.estimatedPomodoros} pomodoros`}>
            {Array.from({ length: taskInfo.estimatedPomodoros }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < taskInfo.completedPomodoros ? 'bg-red-500' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <MiniTimerControls
        state={status.state}
        type={status.type as PomodoroType | null}
        onStart={handleStart}
        onPause={() => void pause()}
        onResume={() => void resume()}
        onStop={() => void stop()}
        onSkip={() => void skip()}
      />
    </div>
  );
}
