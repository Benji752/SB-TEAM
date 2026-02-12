import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  ShoppingBag,
  Calendar as CalendarIcon,
  User,
  Euro,
  MoreVertical,
  Download,
  TrendingUp,
  Filter
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

function uuidToInt(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default function Orders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const exportCSV = () => {
    if (!orders || orders.length === 0) return;
    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const header = "Date,Client,Type,Montant,Statut\n";
    const rows = filtered.map(o =>
      `${o.createdAt ? format(new Date(o.createdAt), "dd/MM/yyyy", { locale: fr }) : "-"},${o.clientName},${o.serviceType},${o.amount},${o.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commandes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export CSV", description: `${filtered.length} commandes exportees` });
  };

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const form = useForm({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      clientName: "",
      serviceType: "Vidéo",
      amount: 0,
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/activity"] });
      toast({ title: "Succès", description: "Commande ajoutée avec succès. +75 XP !" });
      setIsModalOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Succès", description: "Commande supprimée." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/activity"] });
      const bonusMsg = variables.status === "paid" ? " +75 XP Bonus !" : "";
      toast({ title: "Statut mis à jour", description: `Le statut de la commande a été modifié.${bonusMsg}` });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredOrders = orders ? (statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)) : [];
  const totalRevenue = filteredOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount || 0), 0);
  const pendingRevenue = filteredOrders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
              Gestion des <span className="text-gold">Commandes</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
              Suivi du chiffre d'affaires et des prestations
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={exportCSV}
              variant="outline"
              className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 h-11 px-4 rounded-xl text-xs font-bold"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export</span> CSV
            </Button>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold/90 text-black font-black uppercase tracking-widest text-[10px] h-11 px-4 md:px-6 rounded-xl gap-2 shadow-[0_0_20px_rgba(201,162,77,0.2)]">
                  <Plus size={16} /> <span className="hidden sm:inline">Nouvelle</span> Commande
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight italic">
                  Ajouter une commande
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate({ ...data, createdBy: (user as any)?.numericId || (user as any)?.user_id || (typeof user?.id === 'number' ? user.id : undefined) }))} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Client</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12" placeholder="Nom ou Pseudo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Type de Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                            <SelectItem value="Vidéo">Vidéo</SelectItem>
                            <SelectItem value="Photo">Photo</SelectItem>
                            <SelectItem value="Sexting">Sexting</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                            <SelectItem value="Appel">Appel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Montant (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12">
                              <SelectValue placeholder="Statut du paiement" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createMutation.isPending} className="w-full bg-gold text-black font-black uppercase tracking-widest text-[10px] h-12 rounded-xl mt-4">
                    {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Valider"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-[#0A0A0A] border-white/[0.05] p-4 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Total commandes</p>
            <p className="text-2xl font-black text-white">{filteredOrders.length}</p>
          </Card>
          <Card className="bg-[#0A0A0A] border-white/[0.05] p-4 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-500/50 mb-1">CA encaisse</p>
            <p className="text-2xl font-black text-green-400">{totalRevenue} EUR</p>
          </Card>
          <Card className="bg-[#0A0A0A] border-white/[0.05] p-4 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/50 mb-1">En attente</p>
            <p className="text-2xl font-black text-yellow-400">{pendingRevenue} EUR</p>
          </Card>
          <Card className="bg-[#0A0A0A] border-white/[0.05] p-4 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold/50 mb-1">Taux conversion</p>
            <p className="text-2xl font-black text-gold">
              {filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => o.status === 'paid').length / filteredOrders.length) * 100) : 0}%
            </p>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter size={14} className="text-white/20" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white h-9 w-44 rounded-xl text-xs">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="paid">Payees</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="cancelled">Annulees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl md:rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/[0.05] hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Montant</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Statut</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order) => (
                <TableRow key={order.id} className="border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <TableCell className="font-bold text-white/60 text-xs">
                    {order.createdAt ? format(new Date(order.createdAt), "dd/MM", { locale: fr }) : "-"}
                  </TableCell>
                  <TableCell className="font-black text-white uppercase tracking-tight italic">
                    {order.clientName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/[0.1] text-white/40 text-[9px] font-black uppercase tracking-widest">
                      {order.serviceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-white text-lg tracking-tighter">
                    {order.amount} €
                  </TableCell>
                  <TableCell>
                    {order.status === 'pending' ? (
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="h-8 w-[130px] border-none text-[8px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`text-[8px] font-black uppercase tracking-widest ${
                        order.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {order.status === 'paid' ? 'Payé' : 'Annulé'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      onClick={() => {
                        if (confirm("Supprimer cette commande ?")) {
                          deleteMutation.mutate(order.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-white/20 font-black uppercase tracking-widest text-[10px]">
                    Aucune commande enregistrée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
