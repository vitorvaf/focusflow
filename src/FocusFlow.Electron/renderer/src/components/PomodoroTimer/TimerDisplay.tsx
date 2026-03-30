import type { TimerState, PomodoroType } from '../../types';

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  state: TimerState;
  type: PomodoroType | null;
}

const STATE_LABELS: Record<TimerState, string> = {
  Idle:       'Pronto',
  Focus:      'Foco',
  ShortBreak: 'Pausa Curta',
  LongBreak:  'Pausa Longa',
  Paused:     'Pausado',
};

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerDisplay({ remainingSeconds, totalSeconds, state, type }: TimerDisplayProps) {
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const isBreak = type === 'ShortBreak' || type === 'LongBreak';
  const strokeColor = state === 'Idle' ? '#6b7280'
    : isBreak ? '#10b981'
    : '#6366f1';

  const label = type ? STATE_LABELS[type] : STATE_LABELS[state];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={200} height={200} className="-rotate-90">
          {/* Track */}
          <circle
            cx={100} cy={100} r={RADIUS}
            fill="none"
            stroke="#374151"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={100} cy={100} r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center text — counter-rotate to fix the -90 SVG rotation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-4xl font-mono font-bold text-white tracking-tight">
            {minutes}:{seconds}
          </span>
          <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
}
