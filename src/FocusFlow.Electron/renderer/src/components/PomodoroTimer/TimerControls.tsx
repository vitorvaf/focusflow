import type { TimerState } from '../../types';

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerControls({ state, onStart, onPause, onResume, onStop }: TimerControlsProps) {
  const isIdle    = state === 'Idle';
  const isRunning = state === 'Focus' || state === 'ShortBreak' || state === 'LongBreak';
  const isPaused  = state === 'Paused';

  return (
    <div className="flex items-center gap-3">
      {isIdle && (
        <button
          onClick={onStart}
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 active:scale-95 transition-all"
        >
          Iniciar Foco
        </button>
      )}

      {isRunning && (
        <button
          onClick={onPause}
          className="px-6 py-2.5 bg-gray-700 text-gray-100 rounded-lg font-medium hover:bg-gray-600 active:scale-95 transition-all"
        >
          Pausar
        </button>
      )}

      {isPaused && (
        <button
          onClick={onResume}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 active:scale-95 transition-all"
        >
          Retomar
        </button>
      )}

      {!isIdle && (
        <button
          onClick={onStop}
          className="px-4 py-2.5 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          title="Parar sessão"
        >
          Parar
        </button>
      )}
    </div>
  );
}
