import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card gold-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Prospects</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">124</div>
            </CardContent>
          </Card>
          <Card className="glass-card gold-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
            </CardContent>
          </Card>
          <Card className="glass-card gold-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualifiés</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45</div>
            </CardContent>
          </Card>
          <Card className="glass-card gold-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8</div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-gold">Liste des Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-white">
                <thead className="[&_tr]:border-b border-gold/10">
                  <tr className="border-b border-gold/10 transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Source</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {mockProspects.map((p) => (
                    <tr key={p.id} className="border-b border-gold/5 transition-colors hover:bg-white/5">
                      <td className="p-4 align-middle">
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{p.source}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={p.status === 'new' ? 'default' : p.status === 'qualified' ? 'outline' : 'secondary'} className={p.status === 'qualified' ? 'border-gold text-gold' : ''}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">Aujourd'hui</td>
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
