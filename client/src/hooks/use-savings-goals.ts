import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo } from "react";

export interface SavingsGoal {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  target_amount: number;
  saved_amount: number;
  priority: "high" | "medium" | "low";
  status: "in_progress" | "completed";
  created_at: string;
}

export type NewSavingsGoal = {
  title: string;
  description?: string;
  image_url?: string;
  product_url?: string;
  target_amount: number;
  priority?: "high" | "medium" | "low";
};

export function useSavingsGoals() {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["savingsGoals"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("savings_goals")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useSavingsGoals] Supabase error:", error.message);
          return [];
        }
        return (data || []) as SavingsGoal[];
      } catch (error) {
        console.error("[useSavingsGoals] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("savings-goals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings_goals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addGoalMutation = useMutation({
    mutationFn: async (goal: NewSavingsGoal) => {
      const { error } = await supabase.from("savings_goals").insert([goal]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<SavingsGoal> }) => {
      const { error } = await supabase
        .from("savings_goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
  });

  const addSavingsMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const { data, error: fetchError } = await supabase
        .from("savings_goals")
        .select("saved_amount, target_amount")
        .eq("id", id)
        .single();
      if (fetchError || !data) throw fetchError || new Error("Objectif introuvable");

      const newSaved = Math.min(data.saved_amount + amount, data.target_amount);
      const newStatus = newSaved >= data.target_amount ? "completed" : "in_progress";

      const { error } = await supabase
        .from("savings_goals")
        .update({ saved_amount: newSaved, status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
    },
  });

  const addGoal = (goal: NewSavingsGoal) => addGoalMutation.mutate(goal);
  const updateGoal = (id: number, updates: Partial<SavingsGoal>) => updateGoalMutation.mutate({ id, updates });
  const deleteGoal = (id: number) => deleteGoalMutation.mutate(id);
  const addSavings = (id: number, amount: number) => addSavingsMutation.mutate({ id, amount });

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.saved_amount, 0);
    const completedCount = goals.filter((g) => g.status === "completed").length;
    const inProgressCount = goals.filter((g) => g.status === "in_progress").length;
    return { totalTarget, totalSaved, completedCount, inProgressCount };
  }, [goals]);

  return {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addSavings,
    stats,
  };
}
