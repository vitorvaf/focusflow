export interface ElectronAPI {
  /** Shows a native OS notification. */
  showNotification: (title: string, body: string) => void;
  /** Returns the current app version string. */
  getAppVersion: () => Promise<string>;
  /** Hides the window and minimizes it to the system tray. */
  minimizeToTray: () => void;
  /** Toggles between the main window and the mini timer floating window. */
  toggleMiniTimer: () => void;
  /** Closes the mini timer and restores the main window. */
  expandFromMini: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
