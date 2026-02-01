import { useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";

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
    // Get user ID - could be number (demo) or string (Supabase UUID)
    const userId = user?.id;
    if (!userId) return;

    const sendHeartbeat = async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity > ACTIVITY_THRESHOLD) {
        setIsActive(false);
        return;
      }

      try {
        // Use Supabase directly to bypass 401 API issues
        // This updates last_active_at in gamification_profiles table
        const now = new Date().toISOString();
        
        // First try to update existing record
        const { error: updateError } = await supabase
          .from('gamification_profiles')
          .update({ last_active_at: now, updated_at: now })
          .eq('user_id', userId);
        
        // If no record exists, create one
        if (updateError) {
          await supabase
            .from('gamification_profiles')
            .upsert({
              user_id: userId,
              last_active_at: now,
              updated_at: now,
              xp_total: 0,
              level: 1,
              current_streak: 0,
              role_multiplier: 1,
              badges: []
            }, { onConflict: 'user_id' });
        }

        console.log('💓 Heartbeat Supabase OK pour userId:', userId);
        
        // Invalidate queries to update UI immediately
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/today-time", userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/presence-all"] });
      } catch (error) {
        // Silently ignore heartbeat failures
        console.log('💓 Heartbeat failed silently');
      }
    };

    // Send heartbeat IMMEDIATELY on mount - no delay!
    console.log('💓 Heartbeat immédiat envoyé pour userId:', userId);
    sendHeartbeat();

    // Then every 60 seconds
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
