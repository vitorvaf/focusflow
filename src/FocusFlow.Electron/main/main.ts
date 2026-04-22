import { app, BrowserWindow, ipcMain, Menu, Notification, dialog, globalShortcut } from 'electron';
import * as path from 'path';
import { ChildProcess } from 'child_process';
import * as net from 'net';
import { createTray, updateTrayTooltip, updateTrayMenu } from './tray';
import { createMiniWindow, closeMiniWindow, isMiniWindowOpen } from './miniWindow';
import { getApiBinaryName, launchApiProcess, resolveApiProcessConfig } from './apiLauncher';

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
let statusPollInterval: ReturnType<typeof setInterval> | null = null;

// ============================================
// Detectar ambiente e plataforma
// ============================================
const isDev = !app.isPackaged;
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

const API_PORT = 5111;
const API_BASE = `http://localhost:${API_PORT}`;
const API_TIMEOUT_MS = 30_000;
const API_RETRY_MS = 500;

/**
 * Retorna o caminho onde o SQLite deve armazenar o banco em produção.
 * Usa o diretório de dados do app para não perder com atualizações.
 *
 * Windows: C:\Users\{user}\AppData\Roaming\FocusFlow\
 * Linux:   ~/.config/FocusFlow/
 * macOS:   ~/Library/Application Support/FocusFlow/
 */
function getDataPath(): string {
  return app.getPath('userData');
}

/**
 * Retorna o caminho do ícone conforme a plataforma.
 */
function getIconPath(): string {
  const buildDir = path.join(__dirname, '../build');

  if (isWindows) return path.join(buildDir, 'icon.ico');
  if (isMac) return path.join(buildDir, 'icon.icns');
  // Linux: usa PNG
  return path.join(buildDir, 'icon.png');
}

function showErrorAndQuit(message: string): void {
  dialog.showErrorBox('FocusFlow — Erro', message);
  app.quit();
}

/**
 * Verifica se a porta TCP está aceitando conexões
 */
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(200);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

/** Waits for the .NET API health endpoint to respond, retrying until timeout. */
async function waitForApi(): Promise<void> {
  const deadline = Date.now() + API_TIMEOUT_MS;
  let portOpen = false;

  while (Date.now() < deadline) {
    try {
      // Verificar TCP primeiro
      portOpen = await checkPort(API_PORT);
      if (portOpen) {
        // Tentar health check
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
          console.log('[FocusFlow] API pronta!');
          return;
        }
      }
    } catch {
      // Aguardando...
    }
    await new Promise(resolve => setTimeout(resolve, API_RETRY_MS));
  }

  throw new Error(`API não respondeu em ${API_TIMEOUT_MS / 1000}s.`);
}

/** Spawns the .NET API. */
function startApiProcess(): void {
  const config = resolveApiProcessConfig({
    isDev,
    isLinux,
    isWindows,
    mainDir: __dirname,
    resourcesPath: process.resourcesPath,
    pathEnv: process.env.PATH,
  });
  const dataPath = getDataPath();
  const environmentName = isDev ? 'Development' : 'Production';

  console.log(`[FocusFlow] Plataforma: ${process.platform} (${process.arch})`);
  console.log(`[FocusFlow] Dados em: ${dataPath}`);
  console.log(`[FocusFlow] PATH: ${process.env.PATH}`);
  console.log(`[FocusFlow] Iniciando API (${isDev ? 'DEV' : 'PROD'}): ${config.command} ${config.args.join(' ')}`);

  apiProcess = launchApiProcess({
    config,
    apiBase: API_BASE,
    dataPath,
    environmentName,
    onStdout: (message) => {
      console.log('[API]', message);
    },
    onStderr: (message) => {
      console.error('[API:ERR]', message);
    },
    onError: (err) => {
      console.error('[FocusFlow] Erro ao iniciar API:', err.message);

      let hint = '';
      if (err.message.includes('EACCES') && isLinux) {
        hint = '\n\nDica: o binário pode não ter permissão de execução.\nRode: chmod +x ' +
          path.join(process.resourcesPath, 'api', getApiBinaryName(isWindows));
      }

      showErrorAndQuit(`Não foi possível iniciar o servidor backend.\n\n${err.message}${hint}`);
    },
    onExit: (code, signal) => {
      console.warn(`[FocusFlow] API encerrada (code=${code}, signal=${signal})`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        showErrorAndQuit('O servidor backend parou inesperadamente. O app será encerrado.');
      }
    },
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Minimize to tray on close rather than quitting
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();

      // Mostrar notificação
      if (Notification.isSupported()) {
        new Notification({
          title: 'FocusFlow',
          body: 'O app continua rodando na bandeja do sistema.',
          silent: true,
        }).show();
      }
    }
  });
}

function registerIpcHandlers(): void {
  ipcMain.on('show-notification', (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.on('minimize-to-tray', () => {
    mainWindow?.hide();
  });

  // Mini timer: toggle between main window and floating mini timer
  ipcMain.on('toggle-mini-timer', () => {
    if (isMiniWindowOpen()) {
      closeMiniWindow();
      mainWindow?.show();
      mainWindow?.focus();
      console.log('[IPC] toggle-mini-timer → janela principal restaurada');
    } else {
      mainWindow?.hide();
      createMiniWindow();
      console.log('[IPC] toggle-mini-timer → mini timer aberto');
    }
  });

  // Expand: close mini and restore main window
  ipcMain.on('expand-from-mini', () => {
    closeMiniWindow();
    mainWindow?.show();
    mainWindow?.focus();
    console.log('[IPC] expand-from-mini → janela principal restaurada');
  });
}

/** Polls /api/pomodoro/status every 2s to update tray tooltip and context menu. */
function startStatusPolling(): void {
  statusPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pomodoro/status`);
      if (!res.ok) return;

      const status = await res.json() as {
        state: string;
        remainingSeconds: number;
        totalSeconds: number;
        taskId?: number;
      };

      const { state, remainingSeconds } = status;

      if (state === 'Idle') {
        updateTrayTooltip('FocusFlow — Idle');
      } else {
        const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secs = (remainingSeconds % 60).toString().padStart(2, '0');
        updateTrayTooltip(`FocusFlow — ${mins}:${secs} restantes`);
      }

      updateTrayMenu(state, () => mainWindow?.show(), () => {
        (app as unknown as { isQuitting: boolean }).isQuitting = true;
        app.quit();
      });
    } catch {
      // API might not be running; skip silently
    }
  }, 2000);
}

// Flag para permitir fechar de verdade (via tray > Sair)
(app as any).isQuitting = false;

app.on('before-quit', () => {
  (app as any).isQuitting = true;
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();

  console.log(`[FocusFlow] Iniciando (${isDev ? 'DEV' : 'PRODUCTION'}, ${process.platform}/${process.arch})...`);

  // Linux: garantir permissão de execução no binário da API
  if (!isDev && isLinux) {
    const apiBinary = path.join(process.resourcesPath, 'api', getApiBinaryName(isWindows));
    try {
      const fs = require('fs');
      fs.chmodSync(apiBinary, 0o755);
    } catch (err) {
      console.warn('[FocusFlow] Não foi possível definir permissão no binário da API:', err);
    }
  }

  startApiProcess();

  try {
    await waitForApi();
  } catch (err) {
    showErrorAndQuit(
      `O servidor backend não respondeu em ${API_TIMEOUT_MS / 1000}s.\n\n` +
      'Verifique se a porta 5111 não está em uso por outro processo.\n\n' +
      String(err)
    );
    return;
  }

  createWindow();
  createTray(
    () => mainWindow?.show(),
    () => {
      (app as any).isQuitting = true;
      app.quit();
    }
  );

  // Warn Linux users about GNOME system tray visibility
  if (isLinux) {
    console.log(
      '[FocusFlow] ℹ️  Linux detectado. Se o ícone do tray não aparecer no GNOME, ' +
      'instale a extensão "AppIndicator and KStatusNotifierItem Support": ' +
      'https://extensions.gnome.org/extension/615/appindicator-support/'
    );
  }

  // Global shortcut: Ctrl+Shift+M toggles the mini timer
  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (isMiniWindowOpen()) {
      closeMiniWindow();
      mainWindow?.show();
      mainWindow?.focus();
    } else {
      mainWindow?.hide();
      createMiniWindow();
    }
  });
  if (shortcutRegistered) {
    console.log('[FocusFlow] Atalho Ctrl+Shift+M registrado (toggle mini timer)');
  } else {
    console.warn('[FocusFlow] Não foi possível registrar Ctrl+Shift+M (já em uso?)');
  }

  startStatusPolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (statusPollInterval !== null) clearInterval(statusPollInterval);

  if (apiProcess) {
    try {
      console.log('[FocusFlow] Encerrando API...');
      apiProcess.kill('SIGTERM');
    } catch {}
  }
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});
