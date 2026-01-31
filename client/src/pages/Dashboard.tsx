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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
      const targetUrl = "https://stripchat.com/api/front/v2/models/username/WildgirlShow/cam";
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const wrapper = await res.json();
        if (wrapper.contents) {
          const realData = JSON.parse(wrapper.contents);
          if (realData) {
            setApiData(realData);
          }
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

  // DISPLAY LOGIC (THE "BEST OF")
  const displayHourlyRevenue = manualData?.hourlyRevenue || 0;
  const displaySubscribers = manualData?.subscribers || 0;
  const displayStripScore = (apiData?.model?.stripScore > 0) ? apiData.model.stripScore : (manualData?.stripScore || 0);
  const displayFavorites = (apiData?.model?.favoritesCount > 0) ? apiData.model.favoritesCount : (manualData?.favorites || 0);
  const isOnline = apiData?.cam?.isLive === true || manualData?.isOnline === true;

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
    { label: "Favoris", value: displayFavorites, icon: Heart },
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
            <div className="flex items-center gap-3 bg-white/[0.03] px-6 py-2 rounded-2xl border border-white/[0.05]">
              <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {isOnline ? 'Live' : 'Offline'}
              </span>
            </div>
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

        <div className="grid gap-4 md:grid-cols-4">
          {stripStats.map((stat, i) => (
            <Card key={i} className="bg-[#0A0A0A] border-white/[0.05] p-6 rounded-3xl flex flex-col gap-2 hover:border-gold/30 transition-all hover-elevate">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                  <stat.icon size={18} className="text-gold" />
                </div>
                {i === 0 && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">Calcul manuel</Badge>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
              <span className="text-3xl font-black text-white tracking-tighter">
                {stat.value}
              </span>
            </Card>
          ))}
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
      </div>
    </DashboardLayout>
  );
}
