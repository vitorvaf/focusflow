import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';

let miniWindow: BrowserWindow | null = null;

const MINI_WIDTH  = 340;
const MINI_HEIGHT = 180;

const isDev = !app.isPackaged;

/**
 * Creates the floating mini timer window.
 * Positioned at the bottom-right corner of the primary display.
 * If already open, brings it to focus instead of creating a second instance.
 */
export function createMiniWindow(): BrowserWindow {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.focus();
    return miniWindow;
  }

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  miniWindow = new BrowserWindow({
    width:       MINI_WIDTH,
    height:      MINI_HEIGHT,
    x:           screenW - MINI_WIDTH  - 20,
    y:           screenH - MINI_HEIGHT - 20,
    frame:       false,
    transparent: false,
    resizable:   false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable:   true,
    hasShadow:   true,
    show:        false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
    },
  });

  if (isDev) {
    void miniWindow.loadURL('http://localhost:5173/#/mini-timer');
  } else {
    void miniWindow.loadFile(
      path.join(__dirname, '../dist-renderer/index.html'),
      { hash: '/mini-timer' }
    );
  }

  miniWindow.once('ready-to-show', () => {
    miniWindow?.show();
    console.log('[MiniWindow] ✅ Mini timer aberto');
  });

  miniWindow.on('closed', () => {
    console.log('[MiniWindow] Mini timer fechado');
    miniWindow = null;
  });

  return miniWindow;
}

/** Closes the mini timer window if it is open. */
export function closeMiniWindow(): void {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.close();
    miniWindow = null;
  }
}

/** Returns true if the mini window is currently open and not destroyed. */
export function isMiniWindowOpen(): boolean {
  return miniWindow !== null && !miniWindow.isDestroyed();
}

/** Returns the mini window instance, or null if not open. */
export function getMiniWindow(): BrowserWindow | null {
  return miniWindow;
}
