interface HeaderProps {
  boardName: string;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Header({ boardName, darkMode, onToggleDark }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between h-12 px-4 border-b border-gray-700 bg-gray-900 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🍅</span>
        <span className="text-sm font-semibold text-white">FocusFlow</span>
        {boardName && (
          <span className="text-xs text-gray-400 ml-2">{boardName}</span>
        )}
      </div>
      <button
        onClick={onToggleDark}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title={darkMode ? 'Modo claro' : 'Modo escuro'}
      >
        {darkMode ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </header>
  );
}
