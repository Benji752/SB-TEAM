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
  MoreVertical
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

export default function Orders() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const form = useForm({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      clientName: "",
      serviceType: "Vidéo",
      amount: 0,
      status: "paid",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Succès", description: "Commande ajoutée avec succès." });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Statut mis à jour", description: "Le statut de la commande a été modifié." });
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

  return (
    <DashboardLayout>
      <div className="space-y-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
              Gestion des <span className="text-gold">Commandes</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
              Suivi du chiffre d'affaires et des prestations
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-black font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl gap-2 shadow-[0_0_20px_rgba(201,162,77,0.2)]">
                <Plus size={16} /> Nouvelle Commande
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight italic">
                  Ajouter une commande
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 py-4">
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

        <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-[2rem] overflow-hidden">
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
              {orders?.map((order) => (
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
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className={`h-8 w-[130px] border-none text-[8px] font-black uppercase tracking-widest ${
                        order.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-red-500/10 text-red-500'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
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
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-white/20 font-black uppercase tracking-widest text-[10px]">
                    Aucune commande enregistrée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
