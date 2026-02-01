import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";

const ONLINE_THRESHOLD_SECONDS = 900; // 15 minutes - matches 10-minute heartbeat + buffer
const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // Every 10 minutes for +10 XP presence
const ACTIVITY_THRESHOLD = 5 * 60 * 1000;

function uuidToInt(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export interface LeaderboardUser {
  id: number;
  user_id: number;
  username: string | null;
  xp: number;
  level: number;
  current_streak: number;
  role_multiplier: number;
  badges: string[];
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  seconds_since_active: number;
  isOnline: boolean;
  isCurrentUser: boolean;
}

export function useGamificationData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastActivityRef = useRef<number>(Date.now());
  const [isActive, setIsActive] = useState(true);

  const currentUserId = user?.id 
    ? (typeof user.id === 'number' 
        ? user.id 
        : (typeof user.id === 'string' && /^\d+$/.test(user.id))
          ? parseInt(user.id, 10)
          : uuidToInt(String(user.id)))
    : null;

  const currentUsername = user 
    ? ((user as any)?.username || (user as any)?.name || ((user as any)?.email?.split('@')[0]) || null)
    : null;

  const { data: leaderboard = [], isLoading, error, refetch } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/gamification/leaderboard-view"],
    select: (data: any[]) => {
      return data.map((u) => ({
        ...u,
        isOnline: u.user_id === currentUserId ? true : (u.seconds_since_active < ONLINE_THRESHOLD_SECONDS),
        isCurrentUser: u.user_id === currentUserId,
      }));
    },
    refetchInterval: 30000,
  });

  const pingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) return;
      return apiRequest("POST", "/api/gamification/ping", { 
        userId: currentUserId,
        username: currentUsername
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard-view"] });
    },
  });

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIsActive(true);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const sendPing = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > ACTIVITY_THRESHOLD) {
        setIsActive(false);
        return;
      }
      pingMutation.mutate();
    };

    sendPing();
    const interval = setInterval(sendPing, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [currentUserId]);

  const currentUser = leaderboard.find(u => u.isCurrentUser) || null;

  const isUserOnline = (userId: number): boolean => {
    if (userId === currentUserId) return true;
    const user = leaderboard.find(u => u.user_id === userId);
    return user ? user.seconds_since_active < ONLINE_THRESHOLD_SECONDS : false;
  };

  return {
    leaderboard,
    currentUser,
    currentUserId,
    isLoading,
    error,
    refetch,
    isUserOnline,
    isActive,
  };
}
