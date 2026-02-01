import { useQuery } from '@tanstack/react-query';
import { isUserOnline } from '@/lib/onlineStatus';

interface PresenceData {
  userId: number;
  lastActiveAt: string | null;
  isOnline: boolean;
}

type PresenceMap = Record<number, { lastActiveAt: string | null; isOnline: boolean }>;

export function useUserPresence(userId: number | null | undefined) {
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
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const getPresence = (userId: number) => {
    if (!data || !data[userId]) {
      return { isOnline: false, lastActiveAt: null };
    }
    return {
      isOnline: isUserOnline(data[userId].lastActiveAt),
      lastActiveAt: data[userId].lastActiveAt
    };
  };

  return {
    getPresence,
    presenceMap: data || {},
    isLoading,
    error
  };
}
