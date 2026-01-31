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
import { Badge } from "@/components/ui/badge";
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
  Edit2,
  Eye,
  Video,
  Clock,
  ArrowRight
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

export default function Dashboard() {
  const { user } = useAuth();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({ 
    hourlyRevenue: "", 
    subscribers: "",
    stripScore: "",
    favorites: "",
    isOnline: "false"
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"], // Changed from /api/activities/orders to match the new API
    select: (data: any) => data.slice(0, 5) // Take only first 5
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"], // Match useTasks queryKey
    select: (data: any) => data.filter((t: any) => !t.is_done).slice(0, 5) 
  });

  // Separate states for Manual (Supabase) and API (Stripchat)
  const [manualData, setManualData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/model-stats"],
  });

  // Load manual data from Supabase/DB
  const loadManualData = async () => {
    try {
      const res = await apiRequest("GET", "/api/model-stats/latest");
      const data = await res.json();
      if (data) setManualData(data);
    } catch (e) {
      console.error("Failed to load manual data", e);
    }
  };

  // Fetch API data via proxy
  const fetchApiData = async () => {
    try {
      const targetUrl = "https://fr.stripchat.com/api/front/v2/models/username/wildgirlshow";
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const realData = await res.json();
        if (realData) {
          setApiData(realData);
        }
      }
    } catch (e) {
      console.error("API fetch failed, keeping apiData as null", e);
    }
  };

  useEffect(() => {
    loadManualData();
    fetchApiData();
    const interval = setInterval(fetchApiData, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/model-stats", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/model-stats"] });
      setManualData(data); // Immediate update of local manual state
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

  // DISPLAY LOGIC (THE "BEST OF")
  const displayHourlyRevenue = manualData?.hourlyRevenue || 0;
  const displaySubscribers = manualData?.subscribers || 0;
  const displayStripScore = (apiData?.model?.stripScore > 0) ? apiData.model.stripScore : (manualData?.stripScore || 0);
  const displayFavorites = (apiData?.model?.favoritesCount > 0) ? apiData.model.favoritesCount : (manualData?.favorites || 0);
  const viewersCount = apiData?.model?.viewersCount || 0;
  const isOnline = apiData?.model?.status === 'public' || apiData?.model?.isLive === true || manualData?.isOnline === true;
  const snapshotUrl = apiData?.model?.snapshotUrl || apiData?.model?.previewUrl;
  const avatarUrl = apiData?.model?.avatarUrl;
  const roomTitle = apiData?.model?.topic || "Aucun sujet défini";

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

  const statCards = [
    { title: "Revenu Total", value: `${latestStats.revenue.toLocaleString()}€`, trend: "up", change: "+12.5%", icon: DollarSign },
    { title: "Nouveaux Prospects", value: latestStats.new_subscribers.toString(), trend: "up", change: "+18%", icon: Users },
    { title: "Messages", value: "156", trend: "down", change: "-5%", icon: MessageSquare },
    { title: "Taux de Churn", value: `${(latestStats.churn_rate / 100).toFixed(1)}%`, trend: "down", change: "-0.5%", icon: TrendingUp },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">SB <span className="text-gold">Dashboard</span></h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Monitoring Stripchat : WildgirlShow</p>
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

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Now Playing Style Live Monitoring Card */}
          <Card className="lg:col-span-8 bg-[#0A0A0A] border-white/[0.05] rounded-[2.5rem] overflow-hidden group hover:border-gold/20 transition-all duration-500">
            <div className="relative h-full flex flex-col md:flex-row">
              {/* Camera Section */}
              <div className="relative md:w-3/5 h-[300px] md:h-auto overflow-hidden bg-black flex items-center justify-center">
                {isOnline && snapshotUrl ? (
                  <>
                    <img 
                      src={snapshotUrl} 
                      alt="Live Snapshot" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-[#050505]">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-48 h-48 rounded-full object-cover grayscale opacity-20 blur-sm" 
                      />
                    ) : (
                      <Video size={80} className="text-white/5" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                        <Video size={24} className="text-white/20" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Caméra inactive</span>
                    </div>
                  </div>
                )}
                
                {/* Overlay Badge */}
                <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-gray-500'}`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                  </span>
                </div>

                {/* Viewers Counter on Image */}
                {isOnline && (
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <Eye size={14} className="text-gold" />
                    <span className="text-xs font-black text-white">{viewersCount} <span className="text-white/40 font-bold ml-1">VIEWERS</span></span>
                  </div>
                )}
              </div>

              {/* Info Section */}
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
          </Card>

          {/* Side Stats */}
          <div className="lg:col-span-4 flex flex-col gap-4">
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
          </div>
        </div>

        <Card className="glass-card p-10 border-none rounded-[2.5rem] bg-white/[0.01]">
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
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Orders Column */}
          <Card className="glass-card p-8 border-none rounded-[2.5rem] bg-white/[0.01]">
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
                      <Badge className={`${
                        order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      } text-[8px] font-black uppercase tracking-widest px-2 py-1`}>
                        {order.status === 'paid' ? 'Payé' : order.status === 'pending' ? 'En attente' : 'Annulé'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-black uppercase tracking-widest">Aucune commande récente</div>
              )}
            </div>
          </Card>

          {/* Urgent Tasks Column */}
          <Card className="glass-card p-8 border-none rounded-[2.5rem] bg-white/[0.01]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                  <CheckSquare size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Tâches Urgentes</h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Actions requises</p>
                </div>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[9px] gap-2">
                  Voir tout <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {tasksLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" /></div>
              ) : recentTasks && Array.isArray(recentTasks) && recentTasks.length > 0 ? (
                recentTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className="text-sm font-bold text-white uppercase tracking-tight">{task.title}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={task.is_done ? 'completed' : 'todo'}
                        onValueChange={(value) => updateTaskStatusMutation.mutate({ id: task.id, status: value })}
                        disabled={updateTaskStatusMutation.isPending}
                      >
                        <SelectTrigger className={`h-8 w-[110px] border-none text-[8px] font-black uppercase tracking-widest ${
                          task.is_done ? 'bg-emerald-500/10 text-emerald-500' : 
                          'bg-red-500/10 text-red-500'
                        }`}>
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
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
