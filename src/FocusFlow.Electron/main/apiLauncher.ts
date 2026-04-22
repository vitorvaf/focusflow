import { ChildProcess, SpawnOptions, spawn } from 'child_process';
import * as path from 'path';

export interface ApiProcessConfig {
  command: string;
  args: string[];
  cwd?: string;
}

export interface ResolveApiConfigOptions {
  isDev: boolean;
  isLinux: boolean;
  isWindows: boolean;
  mainDir: string;
  resourcesPath: string;
  pathEnv?: string;
}

export interface LaunchApiProcessOptions {
  config: ApiProcessConfig;
  apiBase: string;
  dataPath: string;
  environmentName: 'Development' | 'Production';
  onStdout: (message: string) => void;
  onStderr: (message: string) => void;
  onError: (error: Error) => void;
  onExit: (code: number | null, signal: NodeJS.Signals | null) => void;
}

export type SpawnFunction = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => ChildProcess;

export function getApiBinaryName(isWindows: boolean): string {
  return isWindows ? 'FocusFlow.Api.exe' : 'FocusFlow.Api';
}

export function resolveApiProcessConfig(options: ResolveApiConfigOptions): ApiProcessConfig {
  if (options.isDev) {
    const projectRoot = path.resolve(options.mainDir, '../../../../');
    const apiProjectDir = path.join(projectRoot, 'src/FocusFlow.Api');

    const dotnetCommand = options.isLinux && options.pathEnv?.includes('/usr/bin')
      ? '/usr/bin/dotnet'
      : 'dotnet';

    return {
      command: dotnetCommand,
      args: ['run', '--project', apiProjectDir, '--no-launch-profile'],
      cwd: apiProjectDir,
    };
  }

  return {
    command: path.join(options.resourcesPath, 'api', getApiBinaryName(options.isWindows)),
    args: [],
  };
}

export function launchApiProcess(
  options: LaunchApiProcessOptions,
  spawnFn: SpawnFunction = spawn,
): ChildProcess {
  const env = {
    ...process.env,
    ASPNETCORE_URLS: options.apiBase,
    ASPNETCORE_ENVIRONMENT: options.environmentName,
    DOTNET_ENVIRONMENT: options.environmentName,
    FOCUSFLOW_DATA_PATH: options.dataPath,
  };

  const childProcess = spawnFn(options.config.command, options.config.args, {
    env,
    cwd: options.config.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  childProcess.stdout?.on('data', (data: Buffer | string) => {
    const message = data.toString().trim();
    if (message.length > 0) {
      options.onStdout(message);
    }
  });

  childProcess.stderr?.on('data', (data: Buffer | string) => {
    const message = data.toString().trim();
    if (message.length > 0) {
      options.onStderr(message);
    }
  });

  childProcess.on('error', options.onError);
  childProcess.on('exit', options.onExit);

  return childProcess;
}
