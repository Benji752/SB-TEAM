import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select(`
            *,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Historique d'Activité</h1>
          <p className="text-muted-foreground text-lg">Suivi des connexions et actions système.</p>
        </div>

        <Card className="glass-card border-none overflow-hidden bg-white/[0.02]">
          <CardHeader className="border-b border-white/[0.05] p-6">
            <div className="flex items-center gap-2">
              <Clock className="text-gold h-5 w-5" />
              <CardTitle className="text-white text-xl">Logs Système</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Date & Heure</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Utilisateur</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Action</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/40">Aucun log enregistré</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm text-white/60 font-medium">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/10 overflow-hidden">
                              <AvatarImage 
                                src={log.profiles?.avatar_url} 
                                className="object-cover w-full h-full"
                              />
                              <AvatarFallback className="bg-[#0A0A0A] text-gold text-[10px] uppercase">
                                {log.profiles?.username?.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-white">{log.profiles?.username || "Système"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                            log.action === 'LOGIN' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white/40 italic">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
