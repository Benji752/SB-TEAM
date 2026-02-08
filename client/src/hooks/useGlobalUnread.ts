import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Global hook that tracks unread message count across the entire app.
 * Uses Supabase Realtime to listen for new messages.
 * Resets when user navigates to /messages.
 */
export function useGlobalUnread(): number {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Count initial unread DMs
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
      .then(({ count }) => {
        if (count && count > 0) setUnreadCount(count);
      });

    // Listen for new DMs
    const dmChannel = supabase
      .channel('global-dm-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === currentUserId && msg.sender_id !== currentUserId) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any;
        // When messages are marked as read, decrease count
        if (msg.receiver_id === currentUserId && msg.is_read === true) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    // Listen for new group messages
    const groupChannel = supabase
      .channel('global-group-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== currentUserId) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    // Reset when on messages page
    const checkPath = () => {
      if (window.location.pathname === '/messages') {
        setUnreadCount(0);
      }
    };
    const pathInterval = setInterval(checkPath, 2000);

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
      clearInterval(pathInterval);
    };
  }, [currentUserId]);

  return unreadCount;
}
