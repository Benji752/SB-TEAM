import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const mockProspects = [
  { id: 1, name: "Clara M.", email: "clara@example.com", source: "Instagram", status: "new" },
  { id: 2, name: "Sophie L.", email: "sophie@example.com", source: "Referral", status: "contacted" },
  { id: 3, name: "Emma B.", email: "emma@example.com", source: "Instagram", status: "qualified" },
  { id: 4, name: "Julie R.", email: "julie@example.com", source: "Direct", status: "new" },
];

export default function Prospects() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Prospects</h1>
          <p className="text-muted-foreground">Gérez vos nouveaux talents potentiels.</p>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Prospects</h1>
          <p className="text-muted-foreground text-lg">Gérez vos nouveaux talents potentiels.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="glass-card p-6 border-none">
            <div className="flex flex-row items-center justify-between pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Prospects</span>
              <Users className="h-5 w-5 text-gold" />
            </div>
            <div className="text-3xl font-bold text-white">124</div>
          </Card>
          <Card className="glass-card p-6 border-none">
            <div className="flex flex-row items-center justify-between pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Nouveaux</span>
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">12</div>
          </Card>
          <Card className="glass-card p-6 border-none">
            <div className="flex flex-row items-center justify-between pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Qualifiés</span>
              <UserCheck className="h-5 w-5 text-gold" />
            </div>
            <div className="text-3xl font-bold text-white">45</div>
          </Card>
          <Card className="glass-card p-6 border-none">
            <div className="flex flex-row items-center justify-between pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">En attente</span>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white">8</div>
          </Card>
        </div>

        <Card className="glass-card border-none overflow-hidden">
          <div className="p-8 border-b border-white/[0.05]">
            <h3 className="text-xl font-bold text-white">Liste des Prospects</h3>
          </div>
          <div className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-white">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                    <th className="h-14 px-8 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Nom</th>
                    <th className="h-14 px-8 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Source</th>
                    <th className="h-14 px-8 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Statut</th>
                    <th className="h-14 px-8 text-left align-middle font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {/* Table content replaced with empty or actual data logic later if needed */}
                  <tr className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                    <td className="p-8 align-middle" colSpan={4}>
                      <div className="text-center py-12">
                        <p className="text-muted-foreground font-medium italic">Aucun prospect enregistré pour le moment.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
