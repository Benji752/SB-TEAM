import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, LogIn, LogOut, Clock } from "lucide-react";

export default function LogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/auth-logs"],
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-full w-full flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-10 space-y-8 px-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Logs de Connexion</h1>
          <p className="text-muted-foreground text-lg">Historique des accès et de l'activité du système.</p>
        </div>

        <Card className="glass-card border-none">
          <CardHeader className="bg-white/[0.02] border-b border-white/[0.05]">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="text-gold" size={20} /> Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Utilisateur</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Événement</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Raison</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {Array.isArray(logs) && logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{log.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {log.eventType === "LOGIN" ? (
                            <LogIn size={14} className="text-green-400" />
                          ) : (
                            <LogOut size={14} className="text-red-400" />
                          )}
                          <span className={`text-xs font-bold uppercase ${log.eventType === "LOGIN" ? "text-green-400" : "text-red-400"}`}>
                            {log.eventType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          log.reason === "MANUEL" || log.reason === "SUCCESS"
                            ? "bg-green-400/10 text-green-400 border-green-400/20"
                            : "bg-red-400/10 text-red-400 border-red-400/20"
                        }`}>
                          {log.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white/60">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
