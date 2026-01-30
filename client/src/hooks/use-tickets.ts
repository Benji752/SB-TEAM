import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";

export function useTickets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createTicket = useMutation({
    mutationFn: async (newTicket: any) => {
      const { error } = await supabase
        .from('tickets')
        .insert([{ 
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
          created_by: user?.id,
          status: 'pending'
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  });

  const resolveTicket = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'resolved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  });

  return {
    tickets,
    isLoading,
    createTicket,
    resolveTicket
  };
}
