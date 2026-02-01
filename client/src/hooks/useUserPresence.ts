import { useQuery } from '@tanstack/react-query';
import { isUserOnline } from '@/lib/onlineStatus';

interface PresenceData {
  userId: number | string;
  lastActiveAt: string | null;
  isOnline: boolean;
}

type PresenceMap = Record<string | number, { lastActiveAt: string | null; isOnline: boolean }>;

export function useUserPresence(userId: number | string | null | undefined) {
  const { data, isLoading, error } = useQuery<PresenceData>({
    queryKey: ['/api/user/presence', userId],
    enabled: !!userId,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const isOnline = data?.lastActiveAt ? isUserOnline(data.lastActiveAt) : false;

  return {
    isOnline,
    lastActiveAt: data?.lastActiveAt || null,
    isLoading,
    error
  };
}

export function useAllUsersPresence() {
  const { data, isLoading, error } = useQuery<PresenceMap>({
    queryKey: ['/api/user/presence-all'],
    refetchInterval: 3000, // Refresh every 3 seconds for near-instant updates
    staleTime: 1000,
  });

  const getPresence = (userId: number | string) => {
    const key = String(userId);
    const numKey = Number(userId);
    
    if (!data) {
      return { isOnline: false, lastActiveAt: null };
    }
    
    const entry = data[key] || data[numKey];
    if (!entry) {
      return { isOnline: false, lastActiveAt: null };
    }
    
    return {
      isOnline: isUserOnline(entry.lastActiveAt),
      lastActiveAt: entry.lastActiveAt
    };
  };

  return {
    getPresence,
    presenceMap: data || {},
    isLoading,
    error
  };
}
