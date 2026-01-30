import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  CheckSquare,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();

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

  const latestStats = stats?.[stats.length - 1] || {
    revenue: 0,
    new_subscribers: 0,
    churn_rate: 0
  };

  const statCards = [
    { 
      title: "Revenu Total", 
      value: `${latestStats.revenue.toLocaleString()}€`, 
      change: "+12.5%", 
      trend: "up", 
      icon: DollarSign,
      color: "text-green-500" 
    },
    { 
      title: "Nouveaux Prospects", 
      value: latestStats.new_subscribers.toString(), 
      change: "+18%", 
      trend: "up", 
      icon: Users,
      color: "text-blue-500" 
    },
    { 
      title: "Messages", 
      value: "156", 
      change: "-5%", 
      trend: "down", 
      icon: MessageSquare,
      color: "text-purple-500" 
    },
    { 
      title: "Taux de Churn", 
      value: `${(latestStats.churn_rate / 100).toFixed(1)}%`, 
      change: "-0.5%", 
      trend: "down", 
      icon: TrendingUp,
      color: "text-orange-500" 
    },
  ];

  if (statsLoading) {
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
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Bonjour, {user?.firstName || 'Admin'} !</h1>
          <p className="text-muted-foreground text-lg">Voici l'état actuel de votre agence.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="glass-card p-6 border-none">
              <div className="flex flex-row items-center justify-between pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.title}
                </span>
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                  <stat.icon className="text-gold" size={20} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gold">{stat.value}</div>
                <div className="flex items-center text-xs">
                  {stat.trend === "up" ? (
                    <span className="text-green-400 font-medium flex items-center">
                      <ArrowUpRight size={14} className="mr-1" /> {stat.change}
                    </span>
                  ) : (
                    <span className="text-red-400 font-medium flex items-center">
                      <ArrowDownRight size={14} className="mr-1" /> {stat.change}
                    </span>
                  )}
                  <span className="text-muted-foreground/60 ml-2">vs mois dernier</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 glass-card p-8 border-none">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-1">Aperçu des Revenus</h3>
              <p className="text-sm text-muted-foreground">Suivi de la performance financière.</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#C9A24D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(20, 20, 20, 0.95)", 
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      backdropFilter: "blur(10px)"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#C9A24D" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="col-span-3 glass-card p-8 border-none">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-1">Activités Récentes</h3>
              <p className="text-sm text-muted-foreground">Flux opérationnel en temps réel.</p>
            </div>
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
