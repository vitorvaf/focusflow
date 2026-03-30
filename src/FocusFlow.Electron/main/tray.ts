import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';

const API_BASE = 'http://localhost:5111';

let tray: Tray | null = null;

/** Loads the tray icon, falling back to an empty image if the file is missing. */
function loadIcon(): Electron.NativeImage {
  try {
    const iconPath = path.join(__dirname, 'assets/icon.png');
    return nativeImage.createFromPath(iconPath);
  } catch {
    return nativeImage.createEmpty();
  }
}

/** Creates the system tray icon and sets the initial context menu. */
export function createTray(onRestore: () => void, onQuit: () => void): Tray {
  tray = new Tray(loadIcon());
  tray.setToolTip('FocusFlow — Idle');

  tray.setContextMenu(buildContextMenu('Idle', onRestore, onQuit));

  tray.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.isVisible() ? win.focus() : win.show();
    }
  });

  return tray;
}

/** Updates the tray tooltip text. */
export function updateTrayTooltip(text: string): void {
  tray?.setToolTip(text);
}

/** Rebuilds and sets the context menu based on current timer state. */
export function updateTrayMenu(
  state: string,
  onRestore: () => void,
  onQuit: () => void
): void {
  tray?.setContextMenu(buildContextMenu(state, onRestore, onQuit));
}

/** Builds the context menu template based on timer state. */
function buildContextMenu(
  state: string,
  onRestore: () => void,
  onQuit: () => void
): Electron.Menu {
  const items: Electron.MenuItemConstructorOptions[] = [];

  if (state === 'Focus') {
    items.push({
      label: '⏸ Pausar',
      click: () => void callApi('pause'),
    });
  } else if (state === 'Paused') {
    items.push({
      label: '▶ Retomar',
      click: () => void callApi('resume'),
    });
  } else if (state === 'ShortBreak' || state === 'LongBreak') {
    items.push({
      label: '⏭ Pular Pausa',
      click: () => void callApi('stop'),
    });
  }

  if (items.length > 0) {
    items.push({ type: 'separator' });
  }

  items.push(
    { label: 'Abrir App', click: onRestore },
    { type: 'separator' },
    { label: 'Sair', click: onQuit }
  );

  return Menu.buildFromTemplate(items);
}

/** Sends a POST request to the pomodoro API from the main process. */
async function callApi(action: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/pomodoro/${action}`, { method: 'POST' });
  } catch (err) {
    console.error(`[Tray] callApi(${action}) failed:`, err);
  }
}

