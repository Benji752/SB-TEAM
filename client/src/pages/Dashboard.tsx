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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Bonjour, {user?.firstName || 'Admin'} ! 👋</h1>
          <p className="text-muted-foreground">Voici l'état actuel de votre agence.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={stat.color} size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs mt-1">
                  {stat.trend === "up" ? (
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight size={12} className="mr-1" /> {stat.change}
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <ArrowDownRight size={12} className="mr-1" /> {stat.change}
                    </span>
                  )}
                  <span className="text-muted-foreground ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Aperçu des Revenus</CardTitle>
              <CardDescription>Suivi de la performance financière.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
              <CardDescription>Flux opérationnel en temps réel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  { user: "Alice V.", action: "média téléversé", time: "2h", icon: HardDrive },
                  { user: "Admin", action: "contrat validé", time: "4h", icon: CheckSquare },
                  { user: "Prospect", action: "nouveau message", time: "5h", icon: MessageSquare },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        <span className="font-bold">{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
