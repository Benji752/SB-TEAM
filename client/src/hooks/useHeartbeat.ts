import { useEffect, useRef } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

const PING_INTERVAL_MS = 60 * 1000;

export function useHeartbeat(userId: number | null | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!userId) return;

    const sendPing = async () => {
      try {
        await apiRequest('POST', '/api/user/ping', { userId });
        lastPingRef.current = Date.now();
        // Invalidate presence queries immediately for instant status update
        queryClient.invalidateQueries({ queryKey: ['/api/user/presence-all'] });
      } catch (error) {
        console.error('Heartbeat ping failed:', error);
      }
    };

    // Send ping immediately on mount for instant "online" status
    sendPing();

    intervalRef.current = setInterval(sendPing, PING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId]);

  return { lastPing: lastPingRef.current };
}
