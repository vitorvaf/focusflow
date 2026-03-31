interface MiniTimerDragBarProps {
  onExpand: () => void;
}

/**
 * Draggable title bar for the frameless mini timer window.
 * Uses `-webkit-app-region: drag` for native window dragging.
 * The expand button uses `no-drag` to remain clickable.
 */
export function MiniTimerDragBar({ onExpand }: MiniTimerDragBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 cursor-move select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <span className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">
        FocusFlow
      </span>

      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={onExpand}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded
                     hover:bg-white/10 transition-colors"
          title="Expandir para janela completa"
        >
          ⬜ Expandir
        </button>
      </div>
    </div>
  );
}
