import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'focusflow_settings';

export interface AppSettings {
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  darkMode: boolean;
  vaultPath: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  darkMode: true,
  vaultPath: '',
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as Partial<AppSettings>) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function applyDarkMode(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

/** App settings persisted to localStorage with dark mode sync. */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    applyDarkMode(settings.darkMode);
  }, [settings.darkMode]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleDark = useCallback(() => {
    updateSettings({ darkMode: !settings.darkMode });
  }, [settings.darkMode, updateSettings]);

  return { settings, updateSettings, toggleDark };
}
