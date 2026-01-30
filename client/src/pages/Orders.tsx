import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "En attente paiement", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { value: "paid_to_do", label: "Payé / À faire", color: "bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold" },
  { value: "in_progress", label: "En cours", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { value: "delivered", label: "Livré / Terminé", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  { value: "cancelled", label: "Annulé", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
];

export default function Orders() {
  const { orders, isLoading, updateOrderStatus, updateOrderNotes, createOrder } = useOrders();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    service: "",
    price: "",
    notes: ""
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentative de création...");
    
    try {
      // 1. On prépare les données simples
      const newOrder = {
        client_name: formData.client_name, // Vérifie bien les noms de tes variables d'état
        service: formData.service,
        price: parseInt(formData.price), // On envoie en texte pour éviter les bugs de format
        notes: formData.notes,
        status: 'pending_payment'
      };
      console.log("Envoi de :", newOrder);
      // 2. L'envoi Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select();
      // 3. Gestion d'erreur EXPLICITE
      if (error) {
        console.error("Erreur Supabase:", error);
        alert("ERREUR SUPABASE : " + error.message + " | Détails: " + JSON.stringify(error.details));
        return;
      }
      alert("SUCCÈS ! Commande créée.");
      setIsDialogOpen(false);
      setFormData({ client_name: "", service: "", price: "", notes: "" });
      // Recharger la liste ici est géré par Realtime et React Query
    } catch (err: any) { 
      console.error("Crash JS:", err); 
      alert("CRASH JS : " + err.message); 
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Clients / Commandes</h1>
          <p className="text-muted-foreground text-lg">Suivi collaboratif des prestations et paiements.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="luxury-button flex gap-2">
              <Plus size={20} />
              Nouvelle Commande
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/[0.1] bg-black text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer une commande</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="client">Nom Client</Label>
                <Input
                  id="client"
                  required
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="bg-white/[0.03] border-white/[0.08] rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Type de Prestation</Label>
                <Input
                  id="service"
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="bg-white/[0.03] border-white/[0.08] rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix (€)</Label>
                <Input
                  id="price"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-white/[0.03] border-white/[0.08] rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white/[0.03] border-white/[0.08] rounded-xl min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="luxury-button w-full h-12" disabled={createOrder.isPending}>
                  {createOrder.isPending ? <Loader2 className="animate-spin" /> : "Créer la commande"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-none overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</th>
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prestation</th>
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prix</th>
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-muted-foreground italic">
                    Aucune commande pour le moment.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                    <td className="p-6 text-sm text-white/70">
                      {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-6 font-bold text-white">{order.client_name}</td>
                    <td className="p-6 text-white/80">{order.service}</td>
                    <td className="p-6 font-bold text-gold">{order.price} €</td>
                    <td className="p-6">
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => updateOrderStatus.mutate({ id: order.id, status: value })}
                      >
                        <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.08] text-white h-9 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/[0.1] bg-black">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                              <Badge className={`border ${opt.color} pointer-events-none`}>
                                {opt.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-6 min-w-[200px]">
                      <Input
                        defaultValue={order.notes || ""}
                        onBlur={(e) => {
                          if (e.target.value !== order.notes) {
                            updateOrderNotes.mutate({ id: order.id, notes: e.target.value });
                          }
                        }}
                        className="bg-transparent border-white/[0.05] focus:border-gold/50 text-sm text-white/60 placeholder:text-white/20"
                        placeholder="Détails..."
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
