import { useEffect, useRef } from 'react';
import { socketService } from '../services/socket';
import { useNetwork } from './useNetwork';

export function useSocket(event: string, callback: (data: any) => void) {
  const callbackRef = useRef(callback);
  const { isOffline } = useNetwork();

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Don't connect if offline
    if (isOffline) {
      return;
    }

    // Connect socket if not connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Subscribe to event
    const unsubscribe = socketService.on(event, (data) => {
      callbackRef.current(data);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [event, isOffline]);

  return {
    isConnected: socketService.isConnected(),
    send: (eventName: string, data: any) => socketService.send(eventName, data),
  };
}

