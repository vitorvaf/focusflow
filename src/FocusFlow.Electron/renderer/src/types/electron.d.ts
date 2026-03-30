export interface ElectronAPI {
  /** Shows a native OS notification. */
  showNotification: (title: string, body: string) => void;
  /** Returns the current app version string. */
  getAppVersion: () => Promise<string>;
  /** Hides the window and minimizes it to the system tray. */
  minimizeToTray: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
