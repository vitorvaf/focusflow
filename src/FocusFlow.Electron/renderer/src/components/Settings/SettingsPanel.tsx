import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import type { AppSettings } from '../../hooks/useSettings';

type DraftSettings = Pick<AppSettings, 'focusDurationMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'pomodorosUntilLongBreak' | 'vaultPath'>;

export function SettingsPanel() {
  const { settings, updateSettings, toggleDark } = useSettings();
  const [draft, setDraft] = useState<DraftSettings>({
    focusDurationMinutes:   settings.focusDurationMinutes,
    shortBreakMinutes:       settings.shortBreakMinutes,
    longBreakMinutes:        settings.longBreakMinutes,
    pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak,
    vaultPath:               settings.vaultPath,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (label: string, key: keyof DraftSettings, type: 'number' | 'text' = 'number', min?: number, max?: number) => (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-300 flex-1">{label}</label>
      <input
        type={type}
        min={min}
        max={max}
        value={draft[key]}
        onChange={e => setDraft(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-40 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-base font-semibold text-gray-100 mb-5">Configurações</h2>

      <div className="flex flex-col gap-4">
        <div className="border-b border-gray-700 pb-4 flex flex-col gap-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timer (minutos)</h3>
          {field('Duração do foco',       'focusDurationMinutes',   'number', 1, 120)}
          {field('Pausa curta',            'shortBreakMinutes',       'number', 1, 30)}
          {field('Pausa longa',            'longBreakMinutes',        'number', 1, 60)}
          {field('Pomodoros até pausa longa', 'pomodorosUntilLongBreak', 'number', 2, 10)}
        </div>

        <div className="border-b border-gray-700 pb-4 flex flex-col gap-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Obsidian</h3>
          {field('Caminho do vault', 'vaultPath', 'text')}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Modo escuro</span>
          <button
            onClick={toggleDark}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.darkMode ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="mt-2 w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
        >
          {saved ? '✓ Salvo!' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
