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
  TrendingDown,
  DollarSign,
  Edit2,
  Eye,
  Activity,
  Loader2,
  ArrowRight,
  CheckSquare,
  Star,
  Heart,
  Radio,
  ExternalLink,
  Zap,
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
import { Trophy, Crown, Medal, Award } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18 }
  }
};

const MotionCard = motion(Card);

export default function Dashboard() {
  const { user } = useAuth();
  const { leaderboard } = useGamificationData();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [hourlyRevenueInput, setHourlyRevenueInput] = useState("");
  const [chartRange, setChartRange] = useState<'24h' | '7d' | '30d'>('7d');

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

  // Live Stripchat data
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

  // Manual update mutation
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

  // Display values
  const displayHourlyRevenue = manualData?.hourlyRevenue || 0;
  const displaySubscribers = liveStats?.subscribers || manualData?.subscribers || 0;
  const displayStripScore = liveStats?.stripScore || manualData?.stripScore || 0;
  const displayFavorites = liveStats?.favorites || manualData?.favorites || 0;
  const viewersCount = liveStats?.viewersCount || 0;
  const roomTitle = liveStats?.roomTitle || "WildgirlShow Live";
  const avatarUrl = "https://ui-avatars.com/api/?name=Wild+Girl&background=0A0A0A&color=C9A24D&size=256&bold=true";

  const filterChartData = (data: any[], range: '24h' | '7d' | '30d') => {
    if (!Array.isArray(data)) return [];
    const cutoff = new Date();
    if (range === '24h') cutoff.setHours(cutoff.getHours() - 24);
    else if (range === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);

    return data
      .filter((s: any) => new Date(s.createdAt) >= cutoff)
      .map((s: any) => ({
        time: range === '24h'
          ? format(new Date(s.createdAt), "HH:mm")
          : format(new Date(s.createdAt), "dd/MM HH:mm"),
        revenue: s.hourlyRevenue,
        date: new Date(s.createdAt),
      }));
  };

  const chartData = filterChartData(historyData as any[] || [], chartRange);
  const totalChartRevenue = chartData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const avgChartRevenue = chartData.length > 0 ? Math.round(totalChartRevenue / chartData.length) : 0;

  // Trend calculation: compare latest vs previous entry
  const getTrend = (data: any[], key: string) => {
    if (!Array.isArray(data) || data.length < 2) return null;
    const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const current = sorted[0]?.[key] || 0;
    const previous = sorted[1]?.[key] || 0;
    if (previous === 0) return null;
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct;
  };

  const revenueTrend = getTrend(historyData as any[] || [], 'hourlyRevenue');

  if (historyLoading) {
    return (
      <DashboardLayout>
        <div className="h-full w-full flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const kpiCards = [
    {
      label: "Revenu Horaire",
      value: `${displayHourlyRevenue} €`,
      icon: DollarSign,
      trend: revenueTrend,
      color: "gold",
      manual: true,
    },
    {
      label: "StripScore",
      value: displayStripScore,
      icon: Activity,
      trend: null,
      color: "purple",
    },
    {
      label: "Favoris",
      value: typeof displayFavorites === 'number' ? displayFavorites.toLocaleString() : displayFavorites,
      icon: Heart,
      trend: null,
      color: "pink",
    },
    {
      label: "Abonnés",
      value: displaySubscribers,
      icon: Users,
      trend: null,
      color: "blue",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    gold: { bg: "bg-gold/10", text: "text-gold", border: "border-gold/20", glow: "shadow-gold/5" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/5" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", glow: "shadow-pink-500/5" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/5" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 py-2 md:py-4">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Bonjour, <span className="text-gold">{user?.username || 'Team'}</span>
            </h1>
            <p className="text-white/30 text-xs mt-0.5">
              {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })} • Monitoring WildgirlShow
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
              isOnline
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-white/[0.03] text-white/40 border-white/[0.08]"
            )}>
              <div className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-red-500 animate-pulse" : "bg-white/20"
              )} />
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </div>

            <Dialog open={isUpdateModalOpen} onOpenChange={(open) => {
              setIsUpdateModalOpen(open);
              if (open) setHourlyRevenueInput(manualData?.hourlyRevenue?.toString() || "");
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gold hover:bg-gold-light text-black font-black uppercase tracking-widest text-[10px] h-9 px-4 rounded-xl gap-1.5">
                  <Edit2 size={12} /> MAJ Revenu
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Mise à jour du Revenu Horaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-xs text-white/40">Les autres stats sont automatiques via l'API Stripchat.</p>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenu (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hourlyRevenueInput}
                      onChange={e => setHourlyRevenueInput(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-11"
                      placeholder="ex: 22.3"
                    />
                  </div>
                  <Button
                    onClick={() => updateMutation.mutate({ hourlyRevenue: hourlyRevenueInput })}
                    disabled={updateMutation.isPending}
                    className="w-full bg-gold text-black font-black uppercase tracking-widest text-[10px] h-11 rounded-xl"
                  >
                    {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Sauvegarder"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* ── KPI Cards Row ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpiCards.map((kpi) => {
            const colors = colorMap[kpi.color];
            const Icon = kpi.icon;
            return (
              <MotionCard
                key={kpi.label}
                variants={cardVariants}
                className={cn(
                  "bg-[#0A0A0A] border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col gap-3",
                  "hover:border-white/[0.12] transition-all duration-300",
                  `hover:shadow-lg ${colors.glow}`
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
                    <Icon size={16} className={colors.text} />
                  </div>
                  {kpi.trend !== null && kpi.trend !== undefined && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full",
                      kpi.trend >= 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    )}>
                      {kpi.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {kpi.trend > 0 ? "+" : ""}{kpi.trend}%
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{kpi.label}</p>
                  <p className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">{kpi.value}</p>
                </div>
              </MotionCard>
            );
          })}
        </motion.div>

        {/* ── Live Status + Chart ── */}
        <motion.div
          className="grid gap-4 lg:grid-cols-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Live Status Card */}
          <MotionCard
            variants={cardVariants}
            className={cn(
              "bg-[#0A0A0A] border-white/[0.05] rounded-2xl overflow-hidden",
              isOnline ? "lg:col-span-5" : "lg:col-span-4"
            )}
          >
            {isOnline ? (
              /* ── Online: show embed ── */
              <div className="flex flex-col h-full">
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src="https://stripchat.com/wildgirlshow/embed"
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  {viewersCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 z-10">
                      <Eye size={12} className="text-gold" />
                      <span className="text-[10px] font-black text-white">{viewersCount}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Radio size={12} className="animate-pulse" /> EN DIRECT
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5 line-clamp-1">{roomTitle}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest h-8 rounded-lg gap-1">
                    <a href="https://stripchat.com/wildgirlshow" target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={10} /> Plein écran
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Offline: compact card ── */
              <div className="p-5 md:p-6 flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white/[0.06] bg-[#050505] shrink-0">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-[#0A0A0A] text-gold font-black text-lg">WG</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">WildgirlShow</p>
                  <p className="text-sm font-bold text-white">Hors ligne</p>
                  <p className="text-xs text-white/30 mt-0.5">Les stats sont mises à jour automatiquement quand le live commence.</p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/50 hover:text-white text-[9px] font-black uppercase tracking-widest h-8 rounded-lg shrink-0">
                  <a href="https://stripchat.com/wildgirlshow" target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={10} />
                  </a>
                </Button>
              </div>
            )}
          </MotionCard>

          {/* Performance Chart */}
          <MotionCard
            variants={cardVariants}
            className={cn(
              "bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 md:p-6",
              isOnline ? "lg:col-span-7" : "lg:col-span-8"
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-gold/10 rounded-lg flex items-center justify-center border border-gold/20">
                    <TrendingUp size={14} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Performance</h3>
                    <p className="text-[10px] text-white/30 font-bold">
                      {chartData.length} pts • Moy: {avgChartRevenue}€ • Total: {totalChartRevenue}€
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(['24h', '7d', '30d'] as const).map(range => (
                    <Button
                      key={range}
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartRange(range)}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider h-7 px-2.5 rounded-lg",
                        chartRange === range
                          ? "bg-gold/15 text-gold border border-gold/25"
                          : "text-white/30 hover:text-white/60"
                      )}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-[200px] md:min-h-[280px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenueDashboard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#C9A24D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" fontSize={9} fontWeight="700" tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} fontWeight="700" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} width={40} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(10, 10, 10, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          fontSize: "11px",
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
                        strokeWidth={2.5}
                        activeDot={{ r: 5, fill: "#C9A24D", stroke: "#000", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                    Aucune donnée. Mettez à jour le revenu horaire.
                  </div>
                )}
              </div>
            </div>
          </MotionCard>
        </motion.div>

        {/* ── Bottom Grid: Orders + Tasks + Hunter League ── */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Recent Orders */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <DollarSign size={14} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Commandes</h3>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Tout <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" size={18} /></div>
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div>
                      <p className="text-xs font-bold text-white">{order.clientName}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {order.createdAt ? format(new Date(order.createdAt), "dd MMM", { locale: fr }) : "-"} • {order.serviceType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{order.amount}€</span>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        order.status === 'paid' || order.status === 'completed' ? "bg-emerald-400" : "bg-amber-400"
                      )} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  Aucune commande récente
                </div>
              )}
            </div>
          </MotionCard>

          {/* Urgent Tasks */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                  <Zap size={14} className="text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Tâches</h3>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Gérer <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasksLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" size={18} /></div>
              ) : recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                      <p className="text-xs font-bold text-white truncate">{task.title}</p>
                    </div>
                    <Select
                      value={task.is_done ? 'completed' : 'todo'}
                      onValueChange={(value) => updateTaskStatusMutation.mutate({ id: task.id, status: value })}
                      disabled={updateTaskStatusMutation.isPending}
                    >
                      <SelectTrigger className={cn(
                        "h-6 w-[80px] border-none text-[8px] font-black uppercase tracking-wider rounded-md shrink-0",
                        task.is_done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="completed">Fait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  Tout est à jour !
                </div>
              )}
            </div>
          </MotionCard>

          {/* Hunter League */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-lg flex items-center justify-center border border-yellow-500/20">
                  <Trophy size={14} className="text-yellow-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Hunter League</h3>
              </div>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Voir <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((entry: any, idx: number) => {
                const medals = [
                  <Crown key="crown" size={14} className="text-yellow-400" />,
                  <Medal key="medal" size={14} className="text-gray-300" />,
                  <Award key="award" size={14} className="text-amber-600" />,
                ];
                return (
                  <div key={entry.id || idx} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    idx === 0
                      ? "bg-yellow-500/[0.06] border-yellow-500/15"
                      : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 flex justify-center">
                        {idx < 3 ? medals[idx] : (
                          <span className="text-[10px] font-black text-white/30">#{idx + 1}</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs font-bold",
                        idx === 0 ? "text-yellow-400" : "text-white"
                      )}>{entry.username}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-black",
                      idx === 0 ? "text-yellow-400" : "text-white/50"
                    )}>{entry.xp_total} XP</span>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  En attente de participants...
                </div>
              )}
            </div>
          </MotionCard>
        </motion.div>

        {/* ── Lead Validation (Admin only) ── */}
        {user?.role === 'admin' && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <LeadValidation />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
