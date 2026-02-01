import { useQuery } from '@tanstack/react-query';

// SERVER-SIDE AUTHORITY: NO date calculations on client!
// The server sends isOnline: true/false, we just READ it.

interface PresenceData {
  lastActiveAt: string | null;
  isOnline: boolean;  // Calculated by SERVER only
}

type PresenceMap = Record<string | number, PresenceData>;

export function useUserPresence(userId: number | string | null | undefined) {
  const { data, isLoading, error } = useQuery<PresenceData>({
    queryKey: ['/api/user/presence', userId],
    enabled: !!userId,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // READ server value directly - NO client-side calculation
  return {
    isOnline: data?.isOnline ?? false,
    lastActiveAt: data?.lastActiveAt || null,
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
      return { isOnline: false, lastActiveAt: null };
    }
    
    const entry = data[key] || data[numKey];
    if (!entry) {
      return { isOnline: false, lastActiveAt: null };
    }
    
    // READ server value directly - NO client-side calculation
    return {
      isOnline: entry.isOnline,  // Direct from server
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
