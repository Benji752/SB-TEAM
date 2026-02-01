import { useQuery } from '@tanstack/react-query';
import { isUserOnline } from '@/lib/onlineStatus';

interface PresenceData {
  userId: number;
  lastActiveAt: string | null;
  isOnline: boolean;
}

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

export function useMultipleUserPresence(userIds: number[]) {
  const results = userIds.map(userId => {
    const { data } = useQuery<PresenceData>({
      queryKey: ['/api/user/presence', userId],
      enabled: !!userId,
      refetchInterval: 30000,
      staleTime: 15000,
    });
    
    return {
      userId,
      isOnline: data?.lastActiveAt ? isUserOnline(data.lastActiveAt) : false,
      lastActiveAt: data?.lastActiveAt || null
    };
  });

  return results;
}
