import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useMessages(recipientId?: string, channelId?: string, isSupervision: boolean = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all profiles (excluding current user) with unread counts
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role')
        .neq('id', user?.id)
        .order('username', { ascending: true });
      
      if (profilesError) throw profilesError;

      // Fetch unread counts for each contact
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      const unreadMap: Record<string, number> = {};
      unreadData?.forEach((m: any) => {
        unreadMap[m.sender_id] = (unreadMap[m.sender_id] || 0) + 1;
      });

      return profiles.map((p: any) => ({
        ...p,
        unreadCount: unreadMap[p.id] || 0
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch all conversations for supervision (Admin only)
  const { data: allConversations, isLoading: isLoadingSupervision } = useQuery({
    queryKey: ["supervision-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, channel_id');
      if (error) throw error;
      
      const uniqueConversations = new Map();
      
      data.forEach(m => {
        if (m.channel_id === 'general') {
          uniqueConversations.set('general', { type: 'channel', id: 'general' });
        } else if (m.sender_id && m.receiver_id) {
          const ids = [m.sender_id, m.receiver_id].sort();
          const convId = ids.join('_');
          uniqueConversations.set(convId, { type: 'direct', id1: ids[0], id2: ids[1] });
        }
      });
      
      return Array.from(uniqueConversations.values());
    },
    enabled: !!user?.id && user.role === 'admin' && isSupervision,
  });

  // Fetch messages
  const { data: chatMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", user?.id, recipientId, channelId, isSupervision],
    queryFn: async () => {
      let query = supabase.from('messages').select('*');
      
      if (channelId) {
        query = query.eq('channel_id', channelId);
      } else if (recipientId) {
        if (isSupervision) {
          // supervision pair is either 'general' or 'id1_id2'
          if (recipientId === 'general') {
            query = query.eq('channel_id', 'general');
          } else {
            const [id1, id2] = recipientId.split('_');
            query = query.or(`and(sender_id.eq.${id1},receiver_id.eq.${id2}),and(sender_id.eq.${id2},receiver_id.eq.${id1})`);
          }
        } else {
          // Normal mode: my conversation with recipient
          query = query.or(`and(sender_id.eq.${user?.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user?.id})`);
        }
      } else {
        return [];
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (!!recipientId || !!channelId),
  });

  // Real-time subscription - GLOBAL VERSION FOR INSTANT UPDATES
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          // Invalidate messages to trigger re-fetch and unread count
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["supervision-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || (!recipientId && !channelId) || isSupervision) return;
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: channelId ? null : recipientId,
          channel_id: channelId || null,
          content,
          is_read: false
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || !recipientId || channelId || isSupervision) return;
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', recipientId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    }
  });

  return {
    contacts,
    allConversations,
    chatMessages,
    isLoadingContacts,
    isLoadingMessages,
    isLoadingSupervision,
    sendMessage,
    markAsRead
  };
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user?.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}
