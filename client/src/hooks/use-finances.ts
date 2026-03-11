import { useState, useCallback } from "react";

export interface FinanceEntry {
  id: string;
  month: string; // "2026-03" format
  label: string;
  ca: number; // Chiffre d'affaires
  factures: number; // Factures/charges
  retards: number; // Nombre de retards du modèle
  createdAt: string;
}

export interface FinanceCalculations {
  beneficeBrut: number;
  tauxCommission: number; // % effectif après malus
  partModele: number;
  urssaf: number;
  netFinal: number;
}

const STORAGE_KEY = "sb-finance-entries";

function loadEntries(): FinanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: FinanceEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  const [entries, setEntries] = useState<FinanceEntry[]>(loadEntries);

  const addEntry = useCallback((entry: Omit<FinanceEntry, "id" | "createdAt">) => {
    const newEntry: FinanceEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => {
      const next = [newEntry, ...prev];
      saveEntries(next);
      return next;
    });
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<Omit<FinanceEntry, "id" | "createdAt">>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveEntries(next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEntries(next);
      return next;
    });
  }, []);

  // Aggregated stats
  const totalCA = entries.reduce((sum, e) => sum + e.ca, 0);
  const totalBenefice = entries.reduce((sum, e) => sum + calculateFinance(e).beneficeBrut, 0);
  const totalURSSAF = entries.reduce((sum, e) => sum + calculateFinance(e).urssaf, 0);
  const totalNet = entries.reduce((sum, e) => sum + calculateFinance(e).netFinal, 0);
  const avgBenefice = entries.length > 0 ? totalBenefice / entries.length : 0;

  // Latest entry for payment summary
  const latestEntry = entries.length > 0 ? entries[0] : null;
  const latestCalc = latestEntry ? calculateFinance(latestEntry) : null;

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    stats: { totalCA, avgBenefice, totalURSSAF, totalNet },
    latestEntry,
    latestCalc,
  };
}
