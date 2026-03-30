import { useEffect, useRef } from 'react';
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

    connectionRef.current = connection;

    connection.start().catch((err: unknown) => {
      console.warn('SignalR connection failed:', err);
    });

    return () => {
      void connection.stop();
    };
  }, []);

  const on = (event: string, handler: (...args: unknown[]) => void) => {
    connectionRef.current?.on(event, handler);
  };

  const off = (event: string, handler: (...args: unknown[]) => void) => {
    connectionRef.current?.off(event, handler);
  };

  return { connectionRef, on, off };
}
