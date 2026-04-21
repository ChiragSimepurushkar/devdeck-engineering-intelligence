import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store';
import { useQueryClient } from '@tanstack/react-query';

type ConnectionStatus = 'live' | 'polling' | 'offline';

export function useSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('offline');

  useEffect(() => {
    if (!user?.orgId) return;

    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('live');
      socket.emit('join-org', user.orgId);
    });

    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', () => setStatus('polling'));

    socket.on('pr:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['prs'] });
      queryClient.invalidateQueries({ queryKey: ['bubble-matrix'] });
    });

    socket.on('metrics:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('sync:complete', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['prs'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['connected-repos'] });
    });

    // Polling fallback — if socket drops, poll every 30s
    let pollInterval: ReturnType<typeof setInterval>;
    socket.on('disconnect', () => {
      pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setStatus('polling');
      }, 30_000);
    });
    socket.on('connect', () => clearInterval(pollInterval));

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [user?.orgId, queryClient]);

  return { status, socket: socketRef.current };
}
