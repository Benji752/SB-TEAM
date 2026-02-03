import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useResources() {
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn("[useResources] Supabase error:", error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("[useResources] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel('resources-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["resources"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createResource = useMutation({
    mutationFn: async (newResource: any) => {
      const { error } = await supabase
        .from('resources')
        .insert([newResource]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  });

  const deleteResource = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  });

  return {
    resources,
    isLoading,
    createResource,
    deleteResource
  };
}
