---
applyTo: "src/FocusFlow.Electron/main/**/*.ts"
---

# Electron Main Process Instructions

## Process Management

The Electron main process manages the .NET API as a child process:

```typescript
// Spawn .NET API and wait for health check before opening window
const apiProcess = spawn('dotnet', ['run', '--project', apiProjectPath], {
  env: { ...process.env, ASPNETCORE_URLS: 'http://localhost:5111' }
});

// Health check loop: GET http://localhost:5111/health
// Retry every 500ms, timeout after 30s
```

- Always kill the API process on `app.will-quit`.
- Handle API process crashes: show error dialog and offer restart.
- Never expose Node.js APIs to the renderer — use `contextBridge` in preload.

## Preload Script

Only expose what the renderer needs via `contextBridge.exposeInMainWorld`:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
});
```

## System Tray

- Show tray icon when window is minimized.
- Tray tooltip: "FocusFlow — {remaining} restantes" or "FocusFlow — Idle".
- Tray context menu: Play/Pause, Pular Pausa, Abrir, Sair.
- Single click on tray icon: restore window. Right click: context menu.

## Windows Notifications

Use Electron's `Notification` API for Pomodoro alerts:

```typescript
new Notification({
  title: 'Pomodoro Concluído!',
  body: 'Hora de uma pausa. Você completou 3 de 5 pomodoros.',
  icon: path.join(__dirname, 'assets/icon.png'),
  silent: false,
}).show();
```

## Security

- `nodeIntegration: false` (default).
- `contextIsolation: true` (default).
- `webSecurity: true`.
- CSP header allowing only localhost API and CDN resources.
