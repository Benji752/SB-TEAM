import { useQuery } from '@tanstack/react-query';

// TIMEAGO APPROACH: Server sends secondsSinceLastPing, we judge locally
// No timezone issues - just a simple number comparison!

const ONLINE_THRESHOLD_SECONDS = 300; // 5 minutes

interface PresenceData {
  lastActiveAt: string | null;
  secondsSinceLastPing: number | null;  // Server calculates this
}

type PresenceMap = Record<string | number, PresenceData>;

export function useUserPresence(userId: number | string | null | undefined) {
  const { data, isLoading, error } = useQuery<PresenceData>({
    queryKey: ['/api/user/presence', userId],
    enabled: !!userId,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // TIMEAGO: Simple comparison - no Date objects!
  const isOnline = data?.secondsSinceLastPing !== null && 
                   data?.secondsSinceLastPing !== undefined &&
                   data.secondsSinceLastPing < ONLINE_THRESHOLD_SECONDS;

  return {
    isOnline,
    lastActiveAt: data?.lastActiveAt || null,
    secondsSinceLastPing: data?.secondsSinceLastPing ?? null,
    isLoading,
    error
  };
}

export function useAllUsersPresence() {
  const { data, isLoading, error } = useQuery<PresenceMap>({
    queryKey: ['/api/user/presence-all'],
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const getPresence = (userId: number | string) => {
    const key = String(userId);
    const numKey = Number(userId);
    
    if (!data) {
      return { isOnline: false, lastActiveAt: null, secondsSinceLastPing: null };
    }
    
    const entry = data[key] || data[numKey];
    if (!entry) {
      return { isOnline: false, lastActiveAt: null, secondsSinceLastPing: null };
    }
    
    // TIMEAGO: < 300 seconds = ONLINE (green)
    const isOnline = entry.secondsSinceLastPing !== null && 
                     entry.secondsSinceLastPing < ONLINE_THRESHOLD_SECONDS;
    
    return {
      isOnline,
      lastActiveAt: entry.lastActiveAt,
      secondsSinceLastPing: entry.secondsSinceLastPing
    };
  };

  return {
    getPresence,
    presenceMap: data || {},
    isLoading,
    error
  };
}
