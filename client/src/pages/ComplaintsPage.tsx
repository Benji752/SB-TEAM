import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTickets } from "@/hooks/use-tickets";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Loader2, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tickets, isLoading, createTicket, resolveTicket, deleteTicket } = useTickets();
  
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "normal" as "normal" | "urgent"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicket.mutateAsync(formData);
      setFormData({ subject: "", message: "", priority: "normal" });
      toast({
        title: "Signalement envoyé",
        description: "L'administration a été prévenue.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const allTickets = tickets || [];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-10 bg-[#050505] min-h-screen">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">🆘 Réclamations</h1>
          <p className="text-white/60">Signalez un problème ou une difficulté technique à l'administration.</p>
        </div>

        <Card className="bg-[#0A0A0A]/40 border-white/[0.08] backdrop-blur-xl p-6 max-w-2xl">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold text-white">Nouveau signalement</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white/70">Sujet</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 h-11 text-white"
                placeholder="Ex: Problème d'accès Drive"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white/70">Priorité</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({ ...formData, priority: v as any })}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.1] h-11 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white">
                  <SelectItem value="normal">Normal 🟢</SelectItem>
                  <SelectItem value="urgent">Urgent 🔴</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-white/70">Message détaillé</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 min-h-[120px] text-white resize-none"
                placeholder="Décrivez votre problème ici..."
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 gap-2"
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Envoyer le signalement
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Historique des Réclamations</h2>
            <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1] text-white/50">
              {allTickets.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <div className="grid gap-4">
              {allTickets.length === 0 ? (
                <div className="text-center py-12 text-white/20 border border-dashed border-white/[0.08] rounded-2xl">
                  Aucun ticket enregistré.
                </div>
              ) : (
                allTickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className={cn(
                      "bg-[#0A0A0A]/40 backdrop-blur-xl border-white/[0.08] p-6 transition-all relative group",
                      ticket.priority === 'urgent' && ticket.status !== 'resolved' && "border-red-500/30 bg-red-500/[0.02]",
                      ticket.status === 'resolved' && "opacity-60 bg-white/[0.02]"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
                          {ticket.status === 'resolved' ? (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 font-bold uppercase tracking-wider text-[10px]">
                              RÉSOLU ✅
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-bold uppercase tracking-wider text-[10px]",
                                ticket.priority === 'urgent' 
                                  ? "border-red-500/50 text-red-500 bg-red-500/10" 
                                  : "border-green-500/50 text-green-500 bg-green-500/10"
                              )}
                            >
                              {ticket.priority === 'urgent' ? 'Urgent 🔴' : 'Normal 🟢'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                        <div className="flex items-center gap-4 text-xs text-white/30">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).replace(',', ' à') : "Date inconnue"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            ID: #{ticket.id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {user?.role === 'admin' && ticket.status !== 'resolved' && (
                          <Button
                            onClick={() => resolveTicket.mutate(ticket.id)}
                            disabled={resolveTicket.isPending}
                            className="bg-white/[0.05] hover:bg-green-500/20 hover:text-green-500 text-white border border-white/[0.08] font-semibold gap-2 h-11 no-default-hover-elevate"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marquer comme Résolu
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            deleteTicket.mutate(ticket.id);
                          }}
                          className="text-white/10 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all h-11 w-11"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
