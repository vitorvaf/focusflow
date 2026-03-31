import type { PomodoroType } from '../../types';

interface MiniTimerDisplayProps {
  remainingSeconds: number;
  type: PomodoroType | null;
}

const TYPE_EMOJI: Record<string, string> = {
  Focus:      '🍅',
  ShortBreak: '☕',
  LongBreak:  '🌴',
};

const TYPE_COLOR: Record<string, string> = {
  Focus:      'text-red-400',
  ShortBreak: 'text-emerald-400',
  LongBreak:  'text-blue-400',
};

/**
 * Displays the remaining time in MM:SS format with an emoji indicating session type.
 */
export function MiniTimerDisplay({ remainingSeconds, type }: MiniTimerDisplayProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const emoji = type ? (TYPE_EMOJI[type] ?? '⏸️') : '⏸️';
  const color = type ? (TYPE_COLOR[type] ?? 'text-zinc-500') : 'text-zinc-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" role="img" aria-label={type ?? 'idle'}>
        {emoji}
      </span>
      <span className={`text-3xl font-mono font-bold tracking-wider ${color}`}>
        {display}
      </span>
    </div>
  );
}
