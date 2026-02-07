import { useEffect, useRef, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // Every 10 minutes for +10 XP presence
const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes inactivity threshold

function uuidToInt(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function HeartbeatTracker() {
  const { user } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const [isActive, setIsActive] = useState(true);
  
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
    const rawUserId = user?.id;
    if (!rawUserId) return;

    // Prefer numericId (from cookie auth) or user_id (from Supabase profile)
    const numericUserId = (user as any)?.numericId
      || (user as any)?.user_id
      || (typeof rawUserId === 'number' ? rawUserId : null)
      || (typeof rawUserId === 'string' && /^\d+$/.test(rawUserId) ? parseInt(rawUserId, 10) : null);

    if (!numericUserId) return;

    // Get username from user object (email prefix or username field)
    const userEmail = (user as any)?.email;
    const userName = (user as any)?.username || (user as any)?.name;
    const displayName = userName || (userEmail ? userEmail.split('@')[0] : null);

    const sendHeartbeat = async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity > ACTIVITY_THRESHOLD) {
        setIsActive(false);
        return;
      }

      try {
        await apiRequest("POST", "/api/gamification/heartbeat", { 
          userId: numericUserId,
          username: displayName
        });
        console.log('💓 Heartbeat API OK pour userId:', numericUserId, 'username:', displayName);
        
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile", numericUserId] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/today-time", numericUserId] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/presence-all"] });
      } catch (error) {
        console.log('💓 Heartbeat failed silently');
      }
    };

    console.log('💓 Heartbeat immédiat envoyé pour userId:', numericUserId);
    sendHeartbeat();

    const interval = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  return null;
}

export function useHeartbeatStatus() {
  const [isActive, setIsActive] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIsActive(true);
    };

    const checkActivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > 30000) {
        setIsActive(false);
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    const activityCheckInterval = setInterval(checkActivity, 5000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(activityCheckInterval);
    };
  }, []);

  return isActive;
}
