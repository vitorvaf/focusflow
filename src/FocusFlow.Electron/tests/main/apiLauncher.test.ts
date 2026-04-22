import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { describe, expect, it, vi } from 'vitest';
import {
  launchApiProcess,
  resolveApiProcessConfig,
  SpawnFunction,
} from '../../main/apiLauncher';

function createFakeChildProcess(): ChildProcess {
  const processEmitter = new EventEmitter() as unknown as ChildProcess;
  Object.defineProperty(processEmitter, 'stdout', { value: new PassThrough() });
  Object.defineProperty(processEmitter, 'stderr', { value: new PassThrough() });
  Object.defineProperty(processEmitter, 'kill', { value: vi.fn(() => true) });
  return processEmitter;
}

describe('apiLauncher', () => {
  it('resolves development config with dotnet run command', () => {
    const config = resolveApiProcessConfig({
      isDev: true,
      isLinux: true,
      isWindows: false,
      mainDir: '/workspace/src/FocusFlow.Electron/dist-electron',
      resourcesPath: '/workspace/resources',
      pathEnv: '/usr/bin:/bin',
    });

    expect(config.command).toBe('/usr/bin/dotnet');
    expect(config.args).toEqual([
      'run',
      '--project',
      '/workspace/src/FocusFlow.Api',
      '--no-launch-profile',
    ]);
    expect(config.cwd).toBe('/workspace/src/FocusFlow.Api');
  });

  it('resolves production config with packaged API binary', () => {
    const config = resolveApiProcessConfig({
      isDev: false,
      isLinux: false,
      isWindows: true,
      mainDir: '/workspace/src/FocusFlow.Electron/dist-electron',
      resourcesPath: 'C:/Program Files/FocusFlow/resources',
      pathEnv: 'C:/Windows/System32',
    });

    expect(config.command).toBe('C:/Program Files/FocusFlow/resources/api/FocusFlow.Api.exe');
    expect(config.args).toEqual([]);
    expect(config.cwd).toBeUndefined();
  });

  it('always spawns backend process and wires process events', () => {
    const fakeChild = createFakeChildProcess();
    const spawnMock = vi.fn(((command, args, options) => {
      expect(command).toBe('dotnet');
      expect(args).toEqual(['run']);
      expect(options?.cwd).toBe('/workspace/src/FocusFlow.Api');
      expect(options?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
      expect(options?.env).toEqual(expect.objectContaining({
        ASPNETCORE_URLS: 'http://localhost:5111',
        ASPNETCORE_ENVIRONMENT: 'Production',
        DOTNET_ENVIRONMENT: 'Production',
        FOCUSFLOW_DATA_PATH: 'C:/Users/test/AppData/Roaming/FocusFlow',
      }));
      return fakeChild;
    }) as SpawnFunction);

    const onStdout = vi.fn();
    const onStderr = vi.fn();
    const onError = vi.fn();
    const onExit = vi.fn();

    const child = launchApiProcess({
      config: {
        command: 'dotnet',
        args: ['run'],
        cwd: '/workspace/src/FocusFlow.Api',
      },
      apiBase: 'http://localhost:5111',
      dataPath: 'C:/Users/test/AppData/Roaming/FocusFlow',
      environmentName: 'Production',
      onStdout,
      onStderr,
      onError,
      onExit,
    }, spawnMock);

    expect(child).toBe(fakeChild);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const stdout = child.stdout as PassThrough;
    const stderr = child.stderr as PassThrough;
    stdout.write('backend started\n');
    stderr.write('warn\n');

    const error = new Error('spawn failed');
    child.emit('error', error);
    child.emit('exit', 1, null);

    expect(onStdout).toHaveBeenCalledWith('backend started');
    expect(onStderr).toHaveBeenCalledWith('warn');
    expect(onError).toHaveBeenCalledWith(error);
    expect(onExit).toHaveBeenCalledWith(1, null);
  });
});
