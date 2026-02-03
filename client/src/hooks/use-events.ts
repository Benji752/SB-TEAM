import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });
        
        if (error) {
          console.warn("[useEvents] Supabase error:", error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("[useEvents] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createEvent = useMutation({
    mutationFn: async (newEvent: any) => {
      const { error } = await supabase
        .from('events')
        .insert([newEvent]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  return {
    events,
    isLoading,
    createEvent
  };
}
