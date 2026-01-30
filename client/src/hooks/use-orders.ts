import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export function useOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase
        .from('client_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const updateOrderNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const { error } = await supabase
        .from('client_requests')
        .update({ notes })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const createOrder = useMutation({
    mutationFn: async (newOrder: any) => {
      const { error } = await supabase
        .from('orders')
        .insert([{
          ...newOrder,
          status: 'pending_payment'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  return {
    orders,
    isLoading,
    updateOrderStatus,
    updateOrderNotes,
    createOrder
  };
}
