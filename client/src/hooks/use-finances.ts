import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo } from "react";

export interface FinanceEntry {
  id: number;
  month: string; // "2026-03" format
  label: string;
  ca: number; // Chiffre d'affaires
  factures: number; // Factures/charges
  retards: number; // Nombre de retards du modèle
  created_at: string;
}

export interface FinanceCalculations {
  beneficeBrut: number;
  tauxCommission: number; // % effectif après malus
  partModele: number;
  urssaf: number;
  netFinal: number;
}

export function calculateFinance(entry: FinanceEntry): FinanceCalculations {
  const beneficeBrut = entry.ca - entry.factures;
  const tauxCommission = Math.max(0, 45 - entry.retards * 10);
  const partModele = beneficeBrut > 0 ? beneficeBrut * (tauxCommission / 100) : 0;
  const urssaf = entry.ca * 0.22;
  const netFinal = beneficeBrut - partModele - urssaf;
  return { beneficeBrut, tauxCommission, partModele, urssaf, netFinal };
}

export function useFinances() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["financeEntries"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("finance_entries")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useFinances] Supabase error:", error.message);
          return [];
        }
        return (data || []) as FinanceEntry[];
      } catch (error) {
        console.error("[useFinances] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Realtime sync — changes on any device trigger a refetch
  useEffect(() => {
    const channel = supabase
      .channel("finance-entries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "finance_entries" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["financeEntries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addEntryMutation = useMutation({
    mutationFn: async (entry: { month: string; label: string; ca: number; factures: number; retards: number }) => {
      const { error } = await supabase
        .from("finance_entries")
        .insert([entry]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeEntries"] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<{ month: string; label: string; ca: number; factures: number; retards: number }> }) => {
      const { error } = await supabase
        .from("finance_entries")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeEntries"] });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("finance_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeEntries"] });
    },
  });

  // Wrapper functions matching the old API signature
  const addEntry = (entry: { month: string; label: string; ca: number; factures: number; retards: number }) => {
    addEntryMutation.mutate(entry);
  };

  const updateEntry = (id: number, updates: Partial<{ month: string; label: string; ca: number; factures: number; retards: number }>) => {
    updateEntryMutation.mutate({ id, updates });
  };

  const deleteEntry = (id: number) => {
    deleteEntryMutation.mutate(id);
  };

  // Aggregated stats
  const stats = useMemo(() => {
    const totalCA = entries.reduce((sum, e) => sum + e.ca, 0);
    const totalBenefice = entries.reduce((sum, e) => sum + calculateFinance(e).beneficeBrut, 0);
    const totalURSSAF = entries.reduce((sum, e) => sum + calculateFinance(e).urssaf, 0);
    const totalNet = entries.reduce((sum, e) => sum + calculateFinance(e).netFinal, 0);
    const avgBenefice = entries.length > 0 ? totalBenefice / entries.length : 0;
    return { totalCA, avgBenefice, totalURSSAF, totalNet };
  }, [entries]);

  // Latest entry for payment summary
  const latestEntry = entries.length > 0 ? entries[0] : null;
  const latestCalc = latestEntry ? calculateFinance(latestEntry) : null;

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
    latestEntry,
    latestCalc,
  };
}
