import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  DollarSign,
  Edit2,
  Eye,
  Activity,
  Loader2,
  ArrowRight,
  CheckSquare,
  Star,
  Heart
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadValidation } from "@/components/LeadValidation";
import { useGamificationData } from "@/hooks/useGamificationData";
import { Trophy, Crown } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const MotionCard = motion(Card);

export default function Dashboard() {
  const { user } = useAuth();
  const { leaderboard } = useGamificationData();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [hourlyRevenueInput, setHourlyRevenueInput] = useState("");

  // Orders from API
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    select: (data: any) => Array.isArray(data) ? data.slice(0, 5) : []
  });

  // Tasks from Supabase
  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_done', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  // Live Stripchat data (auto from server API)
  const [isOnline, setIsOnline] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);

  // Chart history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/model-stats"],
  });

  // Last manual stats (for hourly revenue)
  const [manualData, setManualData] = useState<any>(null);

  const loadManualData = async () => {
    try {
      const res = await fetch("/api/model-stats/latest", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data) setManualData(data);
      }
    } catch {}
  };

  // Auto-fetch live status from our server endpoint (Stripchat API)
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/monitor/wildgirl", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLiveStats(data);
        setIsOnline(data.isOnline || false);
      }
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadManualData();
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual update: only hourly revenue (everything else is auto)
  const updateMutation = useMutation({
    mutationFn: async (data: { hourlyRevenue: string }) => {
      const res = await fetch("/api/model-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRevenue: data.hourlyRevenue,
          subscribers: liveStats?.subscribers || manualData?.subscribers || 0,
          stripScore: liveStats?.stripScore || manualData?.stripScore || 0,
          favorites: liveStats?.favorites || manualData?.favorites || 0,
          isOnline: isOnline,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-stats"] });
      setManualData(data);
      setIsUpdateModalOpen(false);
      setHourlyRevenueInput("");
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const is_done = status === 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ is_done })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
  });

  // Display values: live API data first, manual fallback
  const displayHourlyRevenue = manualData?.hourlyRevenue || 0;
  const displaySubscribers = liveStats?.subscribers || manualData?.subscribers || 0;
  const displayStripScore = liveStats?.stripScore || manualData?.stripScore || 0;
  const displayFavorites = liveStats?.favorites || manualData?.favorites || 0;
  const viewersCount = liveStats?.viewersCount || 0;
  const roomTitle = liveStats?.roomTitle || "WildgirlShow Live";
  const avatarUrl = "https://ui-avatars.com/api/?name=Wild+Girl&background=0A0A0A&color=C9A24D&size=256&bold=true";

  const chartData = Array.isArray(historyData) ? historyData.map((s: any) => ({
    time: format(new Date(s.createdAt), "HH:mm"),
    revenue: s.hourlyRevenue
  })) : [];

  if (historyLoading) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic mb-2">SB <span className="text-gold">Dashboard</span></h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Monitoring Stripchat : WildgirlShow</p>
          </div>
          <div className="flex gap-4">
            {/* Only hourly revenue needs manual update */}
            <Dialog open={isUpdateModalOpen} onOpenChange={(open) => {
              setIsUpdateModalOpen(open);
              if (open) {
                setHourlyRevenueInput(manualData?.hourlyRevenue?.toString() || "");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold/90 text-black font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl gap-2 shadow-[0_0_20px_rgba(201,162,77,0.2)]">
                  <Edit2 size={14} /> Revenu Horaire
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white overflow-y-auto max-h-[90vh] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase tracking-tight italic">Mise à jour du Revenu Horaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-white/40">Les autres stats (StripScore, Favoris, Abonnés, Statut Live) sont mises à jour automatiquement via l'API Stripchat.</p>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenu Horaire (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hourlyRevenueInput}
                      onChange={e => setHourlyRevenueInput(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12"
                      placeholder="ex: 22.3"
                    />
                  </div>
                  <Button
                    onClick={() => updateMutation.mutate({ hourlyRevenue: hourlyRevenueInput })}
                    disabled={updateMutation.isPending}
                    className="w-full bg-gold text-black font-black uppercase tracking-widest text-[10px] h-12 rounded-xl mt-4"
                  >
                    {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Sauvegarder"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main model card + stats */}
        <motion.div
          className="grid gap-6 lg:grid-cols-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <MotionCard variants={cardVariants} className="lg:col-span-8 bg-[#0A0A0A] border-white/[0.05] rounded-[2.5rem] overflow-hidden group hover:border-gold/20 transition-all duration-500">
            <div className="relative h-full flex flex-col md:flex-row">
              <div className="relative md:w-3/5 h-[300px] md:h-auto overflow-hidden bg-black flex items-center justify-center min-h-[350px]">
                {isOnline ? (
                  <iframe
                    src="https://stripchat.com/wildgirlshow/embed"
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={avatarUrl}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover scale-110 blur-xl opacity-30 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full" />
                        <Avatar className="h-48 w-48 border-4 border-white/5 shadow-2xl relative bg-[#050505]">
                          <AvatarImage src={avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-[#0A0A0A] text-gold font-black text-4xl italic">WG</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-none z-10">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-500",
                    isOnline ? "bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "bg-gray-500"
                  )} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {isOnline ? 'LIVE' : 'HORS LIGNE'}
                  </span>
                </div>

                {isOnline && viewersCount > 0 && (
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-10">
                    <Eye size={14} className="text-gold" />
                    <span className="text-xs font-black text-white">{viewersCount} <span className="text-white/40 font-bold ml-1">VIEWERS</span></span>
                  </div>
                )}
              </div>

              <div className="md:w-2/5 p-10 flex flex-col justify-between bg-white/[0.01]">
                <div className="space-y-6">
                  <div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.3em] mb-4 block",
                      isOnline ? "text-red-400" : "text-gold"
                    )}>
                      {isOnline ? 'NOW STREAMING' : 'OFFLINE'}
                    </span>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tighter italic uppercase mb-2">
                      {isOnline && roomTitle ? roomTitle : "WildgirlShow"}
                    </h2>
                    <p className="text-white/40 text-sm font-medium">WildgirlShow sur Stripchat</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/[0.05]">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">REVENU HORAIRE</span>
                      <div className="text-xl font-black text-white">{displayHourlyRevenue} €</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">STRIPSCORE</span>
                      <div className="text-xl font-black text-gold">{displayStripScore}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">FAVORIS</span>
                      <div className="text-xl font-black text-white">{typeof displayFavorites === 'number' ? displayFavorites.toLocaleString() : displayFavorites}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">ABONNÉS</span>
                      <div className="text-xl font-black text-white">{displaySubscribers}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      "w-full font-black uppercase tracking-widest text-[9px] h-12 rounded-xl",
                      isOnline
                        ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] text-white"
                    )}
                  >
                    <a href="https://stripchat.com/wildgirlshow" target="_blank" rel="noopener noreferrer">
                      {isOnline ? "Voir le live en plein écran" : "Ouvrir la plateforme"}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </MotionCard>

          {/* Side stats cards */}
          <motion.div variants={cardVariants} className="lg:col-span-4 flex flex-col gap-4">
            <Card className="flex-1 bg-[#0A0A0A] border-white/[0.05] p-8 rounded-[2rem] flex flex-col justify-center gap-2 hover:border-gold/30 transition-all hover-elevate">
              <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05] mb-2">
                <DollarSign size={18} className="text-gold" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Revenu Horaire</span>
              <span className="text-3xl font-black text-white tracking-tighter italic">{displayHourlyRevenue} €</span>
            </Card>
            <Card className="flex-1 bg-[#0A0A0A] border-white/[0.05] p-8 rounded-[2rem] flex flex-col justify-center gap-2 hover:border-gold/30 transition-all hover-elevate">
              <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05] mb-2">
                <Users size={18} className="text-gold" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Abonnés (Fan)</span>
              <span className="text-3xl font-black text-white tracking-tighter italic">{displaySubscribers}</span>
            </Card>
          </motion.div>
        </motion.div>

        {/* Performance Chart */}
        <MotionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-10 border-none rounded-[2.5rem] bg-white/[0.01]"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                <TrendingUp size={18} className="text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Analyse de Performance</h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Évolution du revenu horaire (€)</p>
              </div>
            </div>

            <div className="h-[400px] w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenueDashboard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#C9A24D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v) => `${v} €`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 10, 10, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "16px",
                        backdropFilter: "blur(10px)",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#fff"
                      }}
                      itemStyle={{ color: "#C9A24D" }}
                      formatter={(value: any) => [`${value} €`, "Revenu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#C9A24D"
                      fillOpacity={1}
                      fill="url(#colorRevenueDashboard)"
                      strokeWidth={4}
                      activeDot={{ r: 8, fill: "#C9A24D", stroke: "#000", strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                  Aucune donnée de performance. Mettez à jour le revenu horaire pour commencer.
                </div>
              )}
            </div>
          </div>
        </MotionCard>

        {/* Hunter League Mini Widget */}
        <MotionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-[#0A0A0A] to-[#1a1a2e] border border-purple-500/20 rounded-[2rem] p-6 hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">SB Hunter League</p>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {leaderboard[0]?.username || 'En attente...'}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">#1 Leader</p>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                {leaderboard[0]?.xp_total || 0} XP
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                <Trophy className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </MotionCard>

        {/* Orders + Tasks grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Recent Orders */}
          <MotionCard variants={cardVariants} className="glass-card p-8 border-none rounded-[2.5rem] bg-white/[0.01]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <DollarSign size={18} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Dernières Commandes</h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Flux de revenus récents</p>
                </div>
              </div>
              <Link href="/orders">
                <Button variant="ghost" className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[9px] gap-2">
                  Voir tout <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" /></div>
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-white/10 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-white uppercase tracking-tight">{order.clientName}</div>
                        <Badge variant="outline" className="border-white/[0.1] text-white/30 text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                          {order.serviceType}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr }) : "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black text-white">{order.amount} €</div>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                        order.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                        order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {order.status === 'paid' ? 'PAID' : order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-white/20 border border-dashed border-white/[0.08] rounded-2xl">
                  Aucune commande récente.
                </div>
              )}
            </div>
          </MotionCard>

          {/* Urgent Tasks */}
          <MotionCard variants={cardVariants} className="glass-card p-8 border-none rounded-[2.5rem] bg-white/[0.01]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                  <CheckSquare size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Tâches Urgentes</h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Priorités de l'agence</p>
                </div>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[9px] gap-2">
                  Gérer <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {tasksLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" /></div>
              ) : recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                      <div className="text-sm font-bold text-white uppercase tracking-tight">{task.title}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={task.is_done ? 'completed' : 'todo'}
                        onValueChange={(value) => updateTaskStatusMutation.mutate({ id: task.id, status: value })}
                        disabled={updateTaskStatusMutation.isPending}
                      >
                        <SelectTrigger className={cn(
                          "h-8 w-[110px] border-none text-[8px] font-black uppercase tracking-widest",
                          task.is_done ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                          <SelectItem value="todo">À faire</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-black uppercase tracking-widest">Tout est à jour !</div>
              )}
            </div>
          </MotionCard>

          {/* Lead Validation for Admin */}
          {user?.role === 'admin' && (
            <motion.div variants={cardVariants}>
              <LeadValidation />
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
