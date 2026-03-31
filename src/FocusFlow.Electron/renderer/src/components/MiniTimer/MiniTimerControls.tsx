import type { TimerState, PomodoroType } from '../../types';

interface MiniTimerControlsProps {
  state: TimerState;
  type: PomodoroType | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
}

const btnBase = 'p-1.5 rounded-full hover:bg-white/10 transition-colors text-zinc-300 text-base leading-none';

/**
 * Compact action buttons for the mini timer window.
 * Renders different controls based on the current timer state.
 */
export function MiniTimerControls({
  state, type, onStart, onPause, onResume, onStop, onSkip,
}: MiniTimerControlsProps) {
  const isIdle    = state === 'Idle';
  const isRunning = state === 'Focus' || state === 'ShortBreak' || state === 'LongBreak';
  const isPaused  = state === 'Paused';
  const isBreak   = type === 'ShortBreak' || type === 'LongBreak';

  return (
    <div className="flex items-center justify-center gap-3 pb-3">
      {isIdle && (
        <button
          onClick={onStart}
          className="text-xs px-4 py-1.5 rounded-full bg-red-500 text-white
                     hover:bg-red-600 transition-colors font-medium"
          title="Iniciar Foco"
        >
          ▶ Iniciar
        </button>
      )}

      {isRunning && (
        <>
          <button onClick={onPause} className={btnBase} title="Pausar">⏸</button>
          <button onClick={onStop}  className={btnBase} title="Parar">⏹</button>
          {isBreak && (
            <button onClick={onSkip} className={btnBase} title="Pular Pausa">⏩</button>
          )}
        </>
      )}

      {isPaused && (
        <>
          <button onClick={onResume} className={btnBase} title="Retomar">▶</button>
          <button onClick={onStop}   className={btnBase} title="Parar">⏹</button>
        </>
      )}
    </div>
  );
}
