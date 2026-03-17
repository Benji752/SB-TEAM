import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSavingsGoals, type SavingsGoal, type NewSavingsGoal } from "@/hooks/use-savings-goals";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  PiggyBank,
  Target,
  CheckCircle2,
  TrendingUp,
  Package,
  AlertTriangle,
  Loader2,
  Euro,
} from "lucide-react";

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

const priorityConfig = {
  high: { label: "Haute", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  medium: { label: "Moyenne", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  low: { label: "Basse", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

export default function SavingsGoalsSection() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal, addSavings, stats } = useSavingsGoals();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [addSavingsGoal, setAddSavingsGoal] = useState<SavingsGoal | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [savingsAmount, setSavingsAmount] = useState("");
  const [form, setForm] = useState<NewSavingsGoal>({
    title: "",
    target_amount: 0,
    description: "",
    image_url: "",
    product_url: "",
    priority: "medium",
  });

  const resetForm = () => {
    setForm({ title: "", target_amount: 0, description: "", image_url: "", product_url: "", priority: "medium" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.target_amount <= 0) return;
    addGoal({
      ...form,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      product_url: form.product_url || undefined,
    });
    toast({ title: "Objectif créé", description: `"${form.title}" ajouté avec succès` });
    resetForm();
    setShowCreateDialog(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGoal) return;
    updateGoal(editGoal.id, {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      product_url: form.product_url || null,
      target_amount: form.target_amount,
      priority: form.priority as "high" | "medium" | "low",
    });
    toast({ title: "Modifié", description: "Objectif mis à jour" });
    setEditGoal(null);
    resetForm();
  };

  const handleAddSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSavingsGoal) return;
    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount <= 0) return;
    addSavings(addSavingsGoal.id, amount);
    const newTotal = Math.min(addSavingsGoal.saved_amount + amount, addSavingsGoal.target_amount);
    const pct = Math.round((newTotal / addSavingsGoal.target_amount) * 100);
    toast({ title: "Épargne ajoutée", description: `+${formatEuro(amount)} → ${pct}%` });
    setSavingsAmount("");
    setAddSavingsGoal(null);
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteGoal(deleteId);
    toast({ title: "Supprimé", description: "Objectif supprimé" });
    setDeleteId(null);
  };

  const openEdit = (goal: SavingsGoal) => {
    setForm({
      title: goal.title,
      target_amount: goal.target_amount,
      description: goal.description || "",
      image_url: goal.image_url || "",
      product_url: goal.product_url || "",
      priority: goal.priority,
    });
    setEditGoal(goal);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[360px] bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const overallPct = stats.totalTarget > 0 ? Math.round((stats.totalSaved / stats.totalTarget) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0A0A0A] border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Actifs</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.inProgressCount}</p>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Euro className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total cible</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatEuro(stats.totalTarget)}</p>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Épargné</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatEuro(stats.totalSaved)}</p>
          <p className="text-xs text-muted-foreground mt-1">{overallPct}% du total</p>
        </Card>
        <Card className="bg-[#0A0A0A] border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prêts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completedCount}</p>
        </Card>
      </div>

      {/* Add button (admin only) */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="bg-gold hover:bg-gold/90 text-black font-bold rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Nouvel objectif
          </Button>
        </div>
      )}

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-white/20">
            <PiggyBank size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Aucun objectif d'épargne</h3>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? "Créez-en un pour commencer à tracker vos achats !" : "Aucun objectif en cours pour le moment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100)) : 0;
            const isComplete = goal.status === "completed";
            const prio = priorityConfig[goal.priority];

            return (
              <Card
                key={goal.id}
                className={`bg-[#0A0A0A] border-white/10 rounded-3xl overflow-hidden hover:border-gold/30 transition-all group flex flex-col ${isComplete ? "ring-1 ring-emerald-500/30" : ""}`}
              >
                {/* Image */}
                <div className="relative h-44 bg-white/[0.03] overflow-hidden">
                  {goal.image_url ? (
                    <img
                      src={goal.image_url}
                      alt={goal.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center text-white/10 ${goal.image_url ? "hidden" : ""}`}>
                    <Package size={48} />
                  </div>
                  {/* Priority badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${prio.class} border text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5`}>
                      {prio.label}
                    </Badge>
                  </div>
                  {/* Status badge */}
                  {isComplete && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5">
                        Prêt à acheter
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{goal.description}</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{formatEuro(goal.saved_amount)} / {formatEuro(goal.target_amount)}</span>
                      <span className={`font-bold ${isComplete ? "text-emerald-400" : "text-gold"}`}>{pct}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : ""}`}
                        style={{
                          width: `${pct}%`,
                          ...(!isComplete ? { background: "linear-gradient(to right, #c8a44e, #e2c06d)" } : {}),
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    {isAdmin && !isComplete && (
                      <Button
                        size="sm"
                        onClick={() => { setSavingsAmount(""); setAddSavingsGoal(goal); }}
                        className="bg-gold/10 hover:bg-gold/20 text-gold border-0 rounded-xl text-xs font-bold gap-1.5"
                      >
                        <TrendingUp className="h-3.5 w-3.5" /> Ajouter
                      </Button>
                    )}
                    {goal.product_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="text-muted-foreground hover:text-white rounded-xl text-xs gap-1.5"
                      >
                        <a href={goal.product_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Voir
                        </a>
                      </Button>
                    )}
                    <div className="flex-1" />
                    {isAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(goal)}
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(goal.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== DIALOGS ===== */}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Nouvel objectif</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Titre *</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
                placeholder="Ex: Panneau LED Entrepôt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Prix cible (€) *</label>
              <Input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.target_amount || ""}
                onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
                placeholder="400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Image du produit (URL)</label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Lien d'achat (URL)</label>
              <Input
                value={form.product_url}
                onChange={(e) => setForm({ ...form, product_url: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
                placeholder="https://amazon.fr/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priorité</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-wider border transition-all ${
                      form.priority === p
                        ? priorityConfig[p].class + " ring-1 ring-white/20"
                        : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    {priorityConfig[p].label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[80px] rounded-xl focus:border-gold/50"
                placeholder="Détails, specs, raison de l'achat..."
              />
            </div>
            <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 rounded-xl">
              Créer l'objectif
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(open) => { if (!open) setEditGoal(null); }}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Modifier l'objectif</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Titre *</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Prix cible (€) *</label>
              <Input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.target_amount || ""}
                onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Image du produit (URL)</label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Lien d'achat (URL)</label>
              <Input
                value={form.product_url}
                onChange={(e) => setForm({ ...form, product_url: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priorité</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-wider border transition-all ${
                      form.priority === p
                        ? priorityConfig[p].class + " ring-1 ring-white/20"
                        : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    {priorityConfig[p].label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[80px] rounded-xl focus:border-gold/50"
              />
            </div>
            <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 rounded-xl">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog open={!!addSavingsGoal} onOpenChange={(open) => { if (!open) setAddSavingsGoal(null); }}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-sm rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Ajouter de l'épargne</DialogTitle>
          </DialogHeader>
          {addSavingsGoal && (
            <form onSubmit={handleAddSavings} className="space-y-5 pt-2">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">{addSavingsGoal.title}</p>
                <p className="text-lg font-bold text-white">
                  {formatEuro(addSavingsGoal.saved_amount)} / {formatEuro(addSavingsGoal.target_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reste {formatEuro(addSavingsGoal.target_amount - addSavingsGoal.saved_amount)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Montant à ajouter (€)</label>
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={addSavingsGoal.target_amount - addSavingsGoal.saved_amount}
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50 text-center text-lg"
                  placeholder="30"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 rounded-xl">
                <PiggyBank className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-sm rounded-3xl p-8">
          <div className="text-center space-y-6">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">Supprimer l'objectif ?</h3>
              <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl h-12 text-white hover:bg-white/5 font-bold"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
