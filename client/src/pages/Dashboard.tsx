import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  CheckSquare,
  Loader2,
  Activity,
  Heart,
  Edit2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({ hourlyRevenue: "", subscribers: "" });

  const { data: modelStats, isLoading: modelStatsLoading } = useQuery({
    queryKey: ["/api/model-stats"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/model-stats", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-stats"] });
      setIsUpdateModalOpen(false);
      setUpdateData({ hourlyRevenue: "", subscribers: "" });
    }
  });

  const latestModelStat = Array.isArray(modelStats) ? modelStats[modelStats.length - 1] : null;

  const chartData = Array.isArray(modelStats) ? modelStats.map((s: any) => ({
    time: format(new Date(s.createdAt), "HH:mm"),
    revenue: s.hourlyRevenue
  })) : [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_stats')
        .select('*')
        .order('month', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const latestStats = Array.isArray(stats) ? stats[stats.length - 1] : {
    revenue: 0,
    new_subscribers: 0,
    churn_rate: 0
  };

  const statCards = [
    { title: "Revenu Total", value: `${latestStats.revenue.toLocaleString()}€`, trend: "up", change: "+12.5%", icon: DollarSign },
    { title: "Nouveaux Prospects", value: latestStats.new_subscribers.toString(), trend: "up", change: "+18%", icon: Users },
    { title: "Messages", value: "156", trend: "down", change: "-5%", icon: MessageSquare },
    { title: "Taux de Churn", value: `${(latestStats.churn_rate / 100).toFixed(1)}%`, trend: "down", change: "-0.5%", icon: TrendingUp },
  ];

  const stripStats = [
    { label: "Revenu Horaire", value: `$${latestModelStat?.hourlyRevenue || 0}`, icon: DollarSign },
    { label: "Abonnés (Fan)", value: latestModelStat?.subscribers || 0, icon: Users },
    { label: "Favoris", value: latestModelStat?.favorites || 0, icon: Heart },
    { label: "StripScore", value: latestModelStat?.stripScore || 0, icon: Activity },
  ];

  if (statsLoading || modelStatsLoading) {
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
      <div className="space-y-10 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Bonjour, {user?.firstName || 'Admin'} !</h1>
            <p className="text-muted-foreground text-lg">Voici l'état actuel de votre agence.</p>
          </div>
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-black font-bold h-11 gap-2">
                <Edit2 size={16} /> Actualiser Stripchat
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white">
              <DialogHeader>
                <DialogTitle>Actualiser les données privées</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nouveau Revenu Horaire ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={updateData.hourlyRevenue}
                    onChange={e => setUpdateData({...updateData, hourlyRevenue: e.target.value})}
                    className="bg-white/[0.03] border-white/[0.1] text-white"
                    placeholder="ex: 22.3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nouveaux Abonnés (Fan-club)</Label>
                  <Input 
                    type="number"
                    value={updateData.subscribers}
                    onChange={e => setUpdateData({...updateData, subscribers: e.target.value})}
                    className="bg-white/[0.03] border-white/[0.1] text-white"
                    placeholder="ex: 150"
                  />
                </div>
                <Button 
                  onClick={() => updateMutation.mutate(updateData)}
                  disabled={updateMutation.isPending}
                  className="w-full bg-gold text-black font-bold"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Sauvegarder"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="glass-card p-6 border-none">
              <div className="flex flex-row items-center justify-between pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.title}</span>
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                  <stat.icon className="text-gold" size={20} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gold">{stat.value}</div>
                <div className="flex items-center text-xs">
                  {stat.trend === "up" ? (
                    <span className="text-green-400 font-medium flex items-center"><ArrowUpRight size={14} className="mr-1" /> {stat.change}</span>
                  ) : (
                    <span className="text-red-400 font-medium flex items-center"><ArrowDownRight size={14} className="mr-1" /> {stat.change}</span>
                  )}
                  <span className="text-muted-foreground/60 ml-2">vs mois dernier</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-7 glass-card p-8 border-none space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Monitoring Stripchat : WildgirlShow</h3>
                <p className="text-sm text-muted-foreground">Données hybrides (API publique + Saisie manuelle)</p>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.03] p-2 rounded-xl border border-white/[0.05]">
                <div className={`h-2.5 w-2.5 rounded-full ${latestModelStat?.isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {latestModelStat?.isOnline ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stripStats.map((stat, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                  <stat.icon size={20} className="text-gold mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{stat.label}</span>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-gold" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Évolution Revenu Horaire ($)</h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(20, 20, 20, 0.95)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(10px)" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#C9A24D" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#C9A24D", stroke: "#000", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4 glass-card p-8 border-none">
            <h3 className="text-xl font-bold text-white mb-6">Aperçu des Revenus Agence</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.15}/><stop offset="95%" stopColor="#C9A24D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(20, 20, 20, 0.95)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(10px)" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A24D" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-3 glass-card p-8 border-none">
            <h3 className="text-xl font-bold text-white mb-6">Activités Récentes</h3>
            <div className="space-y-8">
              {[
                { user: "Alice V.", action: "média téléversé", time: "2h", icon: HardDrive },
                { user: "Admin", action: "contrat validé", time: "4h", icon: CheckSquare },
                { user: "Prospect", action: "nouveau message", time: "5h", icon: MessageSquare },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                    <item.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-white/90">
                      <span className="font-bold text-white">{item.user}</span> {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground/60">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
