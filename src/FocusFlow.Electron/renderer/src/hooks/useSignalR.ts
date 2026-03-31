import { useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5111/timer-hub';

/** Manages a SignalR connection to the TimerHub. */
export function useSignalR() {
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting((err) => {
      console.warn('[SignalR] Reconectando...', err?.message);
    });

    connection.onreconnected((id) => {
      console.log('[SignalR] Reconectado. ConnectionId:', id);
    });

    connection.onclose((err) => {
      console.warn('[SignalR] Conexão encerrada.', err?.message ?? '');
    });

    // Store ref BEFORE starting so on/off can register handlers immediately
    connectionRef.current = connection;

    connection.start()
      .then(() => {
        console.log('[SignalR] ✅ Conectado ao TimerHub. ConnectionId:', connection.connectionId);
      })
      .catch((err: unknown) => {
        console.warn('[SignalR] ❌ Falha ao conectar ao TimerHub:', err);
      });

    return () => {
      console.log('[SignalR] Encerrando conexão...');
      void connection.stop();
    };
  }, []);

  // Stable references: wrapped in useCallback so that dependency arrays in
  // consumers (e.g. usePomodoro) do NOT change on every render.
  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (connectionRef.current) {
      connectionRef.current.on(event, handler);
      console.log('[SignalR] Handler registrado para evento:', event);
    }
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    connectionRef.current?.off(event, handler);
  }, []);

  return { connectionRef, on, off };
}
