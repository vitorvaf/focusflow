import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title: string, body: string) =>
    ipcRenderer.send('show-notification', title, body),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
});
