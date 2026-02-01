import { useEffect, useRef, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const HEARTBEAT_INTERVAL = 60 * 1000; // Every 60 seconds
const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes inactivity threshold

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
    // Accept both number and string IDs
    const userId = typeof user?.id === 'number' ? user.id : parseInt(user?.id as string);
    if (!userId || isNaN(userId)) return;

    const sendHeartbeat = async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity > ACTIVITY_THRESHOLD) {
        setIsActive(false);
        return;
      }

      try {
        await apiRequest("POST", "/api/gamification/heartbeat", { userId });
        
        // Invalidate queries to update UI immediately
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/today-time", userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/presence-all"] });
      } catch (error) {
        // Silently ignore heartbeat failures
      }
    };

    // Send heartbeat IMMEDIATELY on mount - no delay!
    console.log('💓 Heartbeat immédiat envoyé pour userId:', userId);
    sendHeartbeat();

    // Then every 60 seconds
    const interval = setInterval(() => {
      console.log('💓 Heartbeat périodique envoyé pour userId:', userId);
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
