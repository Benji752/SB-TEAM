import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn("[useTasks] Supabase error:", error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("[useTasks] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from('tasks')
        .insert([{ title, is_done: false }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, is_done }: { id: number; is_done: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ is_done })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const resetDailyRoutine = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tasks')
        .update({ is_done: false })
        .eq('is_done', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  return {
    tasks,
    isLoading,
    createTask,
    toggleTask,
    deleteTask,
    resetDailyRoutine
  };
}
