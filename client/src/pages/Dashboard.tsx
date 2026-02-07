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
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare,
  Edit2,
  Eye,
  Video,
  Activity,
  Loader2,
  ArrowRight,
  CheckCircle,
  CheckSquare
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

export default function Dashboard() {
  const { user } = useAuth();
  const { leaderboard } = useGamificationData();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({ 
    hourlyRevenue: "", 
    subscribers: "",
    stripScore: "",
    favorites: "",
    isOnline: "false"
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    select: (data: any) => data.slice(0, 5)
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    select: (data: any) => data.filter((t: any) => !t.is_done).slice(0, 5) 
  });

  const [manualData, setManualData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/model-stats"],
  });

  const loadManualData = async () => {
    try {
      const res = await apiRequest("GET", "/api/model-stats/latest");
      const data = await res.json();
      if (data) setManualData(data);
    } catch (e) {
      console.error("Failed to load manual data", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const username = "wildgirlshow";
      const targetUrl = `https://fr.stripchat.com/api/front/v2/models/username/${username}`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const data = await res.json();
        console.log('Retour API:', data);
        setApiData(data);
        
        // Check the path data.user.status as requested
        const status = data?.user?.status;
        setIsOnline(status === 'public');
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      // Silent fail - avoid console errors
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadManualData();
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check status every 30s
    return () => clearInterval(interval);
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/model-stats", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-stats"] });
      setManualData(data);
      setIsUpdateModalOpen(false);
      setUpdateData({ hourlyRevenue: "", subscribers: "", stripScore: "", favorites: "", isOnline: "false" });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const displayHourlyRevenue = manualData?.hourlyRevenue || 0;
  const displaySubscribers = manualData?.subscribers || 0;
  const displayStripScore = manualData?.stripScore || 0;
  const displayFavorites = manualData?.favorites || 0;
  const viewersCount = apiData?.model?.viewersCount || 0;
  const roomTitle = apiData?.model?.topic || "WildgirlShow Live";
  const avatarUrl = "https://ui-avatars.com/api/?name=Wild+Girl&background=0A0A0A&color=C9A24D&size=256&bold=true";

  const chartData = Array.isArray(historyData) ? historyData.map((s: any) => ({
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

  const stripStats = [
    { label: "Revenu Horaire", value: `${displayHourlyRevenue} €`, icon: DollarSign },
    { label: "Abonnés (Fan)", value: displaySubscribers, icon: Users },
    { label: "Viewers", value: viewersCount, icon: Users },
    { label: "StripScore", value: displayStripScore, icon: Activity },
  ];

  if (statsLoading || historyLoading) {
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
            <Dialog open={isUpdateModalOpen} onOpenChange={(open) => {
              setIsUpdateModalOpen(open);
              if (open && manualData) {
                setUpdateData({
                  hourlyRevenue: manualData.hourlyRevenue?.toString() || "",
                  subscribers: manualData.subscribers?.toString() || "",
                  stripScore: manualData.stripScore?.toString() || "",
                  favorites: manualData.favorites?.toString() || "",
                  isOnline: manualData.isOnline?.toString() || "false"
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold/90 text-black font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl gap-2 shadow-[0_0_20px_rgba(201,162,77,0.2)]">
                  <Edit2 size={14} /> Actualiser
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white overflow-y-auto max-h-[90vh] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase tracking-tight italic">Mise à jour Stripchat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenu Horaire (€)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={updateData.hourlyRevenue}
                        onChange={e => setUpdateData({...updateData, hourlyRevenue: e.target.value})}
                        className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12"
                        placeholder="ex: 22.3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Abonnés Fan-club</Label>
                      <Input 
                        type="number"
                        value={updateData.subscribers}
                        onChange={e => setUpdateData({...updateData, subscribers: e.target.value})}
                        className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12"
                        placeholder="ex: 150"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">StripScore</Label>
                      <Input 
                        type="number"
                        value={updateData.stripScore}
                        onChange={e => setUpdateData({...updateData, stripScore: e.target.value})}
                        className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12"
                        placeholder="ex: 645"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Favoris</Label>
                      <Input 
                        type="number"
                        value={updateData.favorites}
                        onChange={e => setUpdateData({...updateData, favorites: e.target.value})}
                        className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12"
                        placeholder="ex: 5000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Statut</Label>
                    <Select 
                      value={updateData.isOnline} 
                      onValueChange={(v) => setUpdateData({...updateData, isOnline: v})}
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                        <SelectItem value="true">En ligne 🟢</SelectItem>
                        <SelectItem value="false">Hors ligne ⚪</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => updateMutation.mutate(updateData)}
                    disabled={updateMutation.isPending}
                    className="w-full bg-gold text-black font-black uppercase tracking-widest text-[10px] h-12 rounded-xl mt-4"
                  >
                    {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Sauvegarder les modifications"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <motion.div 
          className="grid gap-6 lg:grid-cols-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <MotionCard variants={cardVariants} className="lg:col-span-8 bg-[#0A0A0A] border-white/[0.05] rounded-[2.5rem] overflow-hidden group hover:border-gold/20 transition-all duration-500">
            <div className="relative h-full flex flex-col md:flex-row">
              <div className="relative md:w-3/5 h-[300px] md:h-auto overflow-hidden bg-black flex items-center justify-center">
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
                        <AvatarFallback className="bg-[#0A0A0A] text-gold font-black text-4xl italic">
                          WG
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                
                {/* Overlay Badge */}
                <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-none z-10">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-500",
                    isOnline ? "bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" : "bg-gray-500"
                  )} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                  </span>
                </div>

                {isOnline && (
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-10">
                    <Eye size={14} className="text-gold" />
                    <span className="text-xs font-black text-white">{viewersCount} <span className="text-white/40 font-bold ml-1">VIEWERS</span></span>
                  </div>
                )}
              </div>

              <div className="md:w-2/5 p-10 flex flex-col justify-between bg-white/[0.01]">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-4 block">NOW STREAMING</span>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tighter italic uppercase mb-2">
                      {isOnline ? roomTitle : "WildgirlShow"}
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
                  </div>
                </div>

                <div className="pt-8">
                  <Button 
                    asChild
                    variant="outline" 
                    className="w-full border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] text-white font-black uppercase tracking-widest text-[9px] h-12 rounded-xl"
                  >
                    <a 
                      href={`https://stripchat.com/wildgirlshow`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Ouvrir la plateforme
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </MotionCard>

          <motion.div variants={cardVariants} className="lg:col-span-4 flex flex-col gap-4">
            {stripStats.slice(0, 2).map((stat, i) => (
              <Card key={i} className="flex-1 bg-[#0A0A0A] border-white/[0.05] p-8 rounded-[2rem] flex flex-col justify-center gap-2 hover:border-gold/30 transition-all hover-elevate">
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05] mb-2">
                  <stat.icon size={18} className="text-gold" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
                <span className="text-3xl font-black text-white tracking-tighter italic">
                  {stat.value}
                </span>
              </Card>
            ))}
          </motion.div>
        </motion.div>

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

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
              ) : recentOrders && Array.isArray(recentOrders) && recentOrders.length > 0 ? (
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
                        order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {order.status}
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
              ) : recentTasks && Array.isArray(recentTasks) && recentTasks.length > 0 ? (
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
