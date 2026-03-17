import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinances, calculateFinance, type FinanceEntry } from "@/hooks/use-finances";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Building2,
  PiggyBank,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Euro,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(mo) - 1]} ${y}`;
}

export default function Finances() {
  const { entries, isLoading, addEntry, updateEntry, deleteEntry, stats, latestEntry, latestCalc } = useFinances();
  const { toast } = useToast();

  // Form state
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [label, setLabel] = useState("");
  const [ca, setCa] = useState("");
  const [factures, setFactures] = useState("");
  const [retards, setRetards] = useState("0");
  const [showForm, setShowForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FinanceEntry>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !ca) {
      toast({ title: "Champs requis", description: "Remplis au moins le libelle et le CA.", variant: "destructive" });
      return;
    }
    addEntry({
      month,
      label: label.trim(),
      ca: parseFloat(ca) || 0,
      factures: parseFloat(factures) || 0,
      retards: parseInt(retards) || 0,
    });
    setLabel("");
    setCa("");
    setFactures("");
    setRetards("0");
    setShowForm(false);
    toast({ title: "Entree ajoutee", description: `${label} - ${monthLabel(month)}` });
  };

  const startEdit = (entry: FinanceEntry) => {
    setEditingId(entry.id);
    setEditData({ month: entry.month, label: entry.label, ca: entry.ca, factures: entry.factures, retards: entry.retards });
  };

  const confirmEdit = () => {
    if (editingId) {
      updateEntry(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  // Chart data (sorted by month ascending)
  const chartData = [...entries]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((e) => {
      const calc = calculateFinance(e);
      return {
        month: monthLabel(e.month),
        CA: e.ca,
        Net: calc.netFinal,
      };
    });

  const statCards = [
    { label: "CA Total", value: formatEuro(stats.totalCA), icon: Wallet, color: "text-gold" },
    { label: "Benefice Moyen", value: formatEuro(stats.avgBenefice), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Provision URSSAF", value: formatEuro(stats.totalURSSAF), icon: Building2, color: "text-orange-400" },
    { label: "Net Reel", value: formatEuro(stats.totalNet), icon: PiggyBank, color: stats.totalNet >= 0 ? "text-emerald-400" : "text-red-400" },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1">
              <Wallet className="inline-block w-8 h-8 mr-3 text-gold" />
              SB Finance Tracker
            </h1>
            <p className="text-white/60 text-sm md:text-base">Gestion financiere, commissions et provisions URSSAF.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gold hover:bg-gold/90 text-black font-bold h-11 px-6 rounded-xl gap-2"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? "Fermer" : "Nouvelle entree"}
          </Button>
        </div>

        {/* Add Entry Form */}
        {showForm && (
          <Card className="bg-[#0A0A0A]/60 border-white/[0.08] backdrop-blur-xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg uppercase tracking-widest text-xs">Ajouter une entree</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Mois</label>
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Libelle</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: OnlyFans Mars"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires</label>
                <Input type="number" step="0.01" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="0"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Factures / Charges</label>
                <Input type="number" step="0.01" value={factures} onChange={(e) => setFactures(e.target.value)} placeholder="0"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Retards du modele</label>
                <Input type="number" min="0" value={retards} onChange={(e) => setRetards(e.target.value)} placeholder="0"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-gold hover:bg-gold/90 text-black font-bold h-11 w-full rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="bg-[#0A0A0A]/60 border-white/[0.08] backdrop-blur-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-xl bg-white/[0.05]", card.color)}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{card.label}</p>
              <p className={cn("text-xl md:text-2xl font-black tracking-tight", card.color)}>{card.value}</p>
            </Card>
          ))}
        </div>

        {/* Payment Summary (last entry) */}
        {latestEntry && latestCalc && (
          <div className="space-y-3">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">
              Recapitulatif de Paiement — {monthLabel(latestEntry.month)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/[0.02] border-purple-500/20 backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/20">
                    <UserMinus className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest">A payer au Modele</span>
                </div>
                <p className="text-3xl font-black text-purple-400 tracking-tight">{formatEuro(latestCalc.partModele)}</p>
                <p className="text-white/30 text-xs mt-2">Commission : {latestCalc.tauxCommission}% du benefice{latestEntry.retards > 0 && ` (malus -${latestEntry.retards * 10}%)`}</p>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/[0.02] border-orange-500/20 backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-orange-500/20">
                    <Building2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest">A payer URSSAF</span>
                </div>
                <p className="text-3xl font-black text-orange-400 tracking-tight">{formatEuro(latestCalc.urssaf)}</p>
                <p className="text-white/30 text-xs mt-2">22% du CA ({formatEuro(latestEntry.ca)})</p>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/20 backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20">
                    <Euro className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Net pour SB Digital</span>
                </div>
                <p className={cn("text-3xl font-black tracking-tight", latestCalc.netFinal >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatEuro(latestCalc.netFinal)}
                </p>
                <p className="text-white/30 text-xs mt-2">Benefice - Modele - URSSAF</p>
              </Card>
            </div>
          </div>
        )}

        {/* Chart: CA vs Net */}
        {chartData.length >= 2 && (
          <Card className="bg-[#0A0A0A]/60 border-white/[0.08] backdrop-blur-xl p-4 md:p-6">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Evolution CA vs Net</h2>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradientCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A24D" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C9A24D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}
                    formatter={(value: number) => formatEuro(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                  <Area type="monotone" dataKey="CA" stroke="#C9A24D" fill="url(#gradientCA)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Net" stroke="#34d399" fill="url(#gradientNet)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* History Table */}
        <Card className="bg-[#0A0A0A]/60 border-white/[0.08] backdrop-blur-xl p-4 md:p-6">
          <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Historique complet</h2>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/30 text-sm">Chargement...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Aucune entree financiere.</p>
              <p className="text-white/15 text-xs mt-1">Clique sur "Nouvelle entree" pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/[0.05]">
                    <th className="text-left py-3 px-2">Mois</th>
                    <th className="text-left py-3 px-2">Libelle</th>
                    <th className="text-right py-3 px-2">CA</th>
                    <th className="text-right py-3 px-2">Factures</th>
                    <th className="text-right py-3 px-2">Retards</th>
                    <th className="text-right py-3 px-2">Benefice</th>
                    <th className="text-right py-3 px-2">Modele</th>
                    <th className="text-right py-3 px-2">URSSAF</th>
                    <th className="text-right py-3 px-2">Net</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const calc = calculateFinance(entry);
                    const isEditing = editingId === entry.id;
                    return (
                      <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2 text-white/60 whitespace-nowrap">
                          {isEditing ? (
                            <Input type="month" value={editData.month || ""} onChange={(e) => setEditData({ ...editData, month: e.target.value })}
                              className="bg-white/[0.05] border-white/[0.1] text-white h-8 text-xs w-32" />
                          ) : monthLabel(entry.month)}
                        </td>
                        <td className="py-3 px-2 text-white font-medium">
                          {isEditing ? (
                            <Input value={editData.label || ""} onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                              className="bg-white/[0.05] border-white/[0.1] text-white h-8 text-xs w-36" />
                          ) : entry.label}
                        </td>
                        <td className="py-3 px-2 text-right text-gold font-bold whitespace-nowrap">
                          {isEditing ? (
                            <Input type="number" value={editData.ca ?? ""} onChange={(e) => setEditData({ ...editData, ca: parseFloat(e.target.value) || 0 })}
                              className="bg-white/[0.05] border-white/[0.1] text-white h-8 text-xs w-24 text-right" />
                          ) : formatEuro(entry.ca)}
                        </td>
                        <td className="py-3 px-2 text-right text-white/50 whitespace-nowrap">
                          {isEditing ? (
                            <Input type="number" value={editData.factures ?? ""} onChange={(e) => setEditData({ ...editData, factures: parseFloat(e.target.value) || 0 })}
                              className="bg-white/[0.05] border-white/[0.1] text-white h-8 text-xs w-24 text-right" />
                          ) : formatEuro(entry.factures)}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          {isEditing ? (
                            <Input type="number" min="0" value={editData.retards ?? ""} onChange={(e) => setEditData({ ...editData, retards: parseInt(e.target.value) || 0 })}
                              className="bg-white/[0.05] border-white/[0.1] text-white h-8 text-xs w-16 text-right" />
                          ) : (
                            <span className={entry.retards > 0 ? "text-red-400 font-bold" : "text-white/30"}>{entry.retards}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-white/70 font-medium whitespace-nowrap">{formatEuro(calc.beneficeBrut)}</td>
                        <td className="py-3 px-2 text-right text-purple-400 whitespace-nowrap">{formatEuro(calc.partModele)}</td>
                        <td className="py-3 px-2 text-right text-orange-400 whitespace-nowrap">{formatEuro(calc.urssaf)}</td>
                        <td className={cn("py-3 px-2 text-right font-bold whitespace-nowrap", calc.netFinal >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {formatEuro(calc.netFinal)}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-1 justify-end">
                              <Button size="icon" variant="ghost" onClick={confirmEdit}
                                className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10">
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setEditData({}); }}
                                className="h-7 w-7 text-white/30 hover:bg-white/[0.05]">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ opacity: 1 }}>
                              <Button size="icon" variant="ghost" onClick={() => startEdit(entry)}
                                className="h-7 w-7 text-white/30 hover:text-gold hover:bg-gold/10">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteEntry(entry.id)}
                                className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
