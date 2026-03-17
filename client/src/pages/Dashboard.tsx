import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  Users,
  Loader2,
  ArrowRight,
  Zap,
  MessageSquare,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { LeadValidation } from "@/components/LeadValidation";
import { useGamificationData } from "@/hooks/useGamificationData";
import { useGlobalUnread } from "@/hooks/useGlobalUnread";
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
  const { unreadCount } = useGlobalUnread();

  // Tasks from Supabase
  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_done', false)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    }
  });

  // Open tasks count
  const { data: openTasksCount } = useQuery({
    queryKey: ["dashboard-tasks-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_done', false);
      if (error) throw error;
      return count || 0;
    }
  });

  // Open tickets count
  const { data: openTicketsCount } = useQuery({
    queryKey: ["dashboard-tickets-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    }
  });

  // Recent orders (no amounts)
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  // Upcoming events
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  // Team online (from gamification leaderboard which has online status)
  const onlineCount = leaderboard.filter((m: any) => m.is_online).length;

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
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks-count"] });
    },
  });

  // KPI data
  const kpiCards = [
    {
      label: "Tâches en cours",
      value: openTasksCount ?? 0,
      icon: Zap,
      color: "amber",
      href: "/tasks",
    },
    {
      label: "Messages non lus",
      value: unreadCount ?? 0,
      icon: MessageSquare,
      color: "blue",
      href: "/messages",
    },
    {
      label: "Équipe en ligne",
      value: onlineCount,
      icon: Users,
      color: "emerald",
      href: "/leaderboard",
    },
    {
      label: "Tickets ouverts",
      value: openTicketsCount ?? 0,
      icon: AlertCircle,
      color: "red",
      href: "/reclamations",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  };

  const getEventDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, "EEE dd MMM", { locale: fr });
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
              {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/tasks">
              <Button size="sm" variant="outline" className="border-white/[0.08] text-white/60 hover:text-white text-[10px] font-bold h-8 rounded-lg gap-1.5">
                <Zap size={12} /> Nouvelle tâche
              </Button>
            </Link>
            <Link href="/messages">
              <Button size="sm" variant="outline" className="border-white/[0.08] text-white/60 hover:text-white text-[10px] font-bold h-8 rounded-lg gap-1.5">
                <MessageSquare size={12} /> Messages
              </Button>
            </Link>
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
            const hasAlert = typeof kpi.value === 'number' && kpi.value > 0;
            return (
              <Link key={kpi.label} href={kpi.href}>
                <MotionCard
                  variants={cardVariants}
                  className={cn(
                    "bg-[#0A0A0A] border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col gap-3 cursor-pointer",
                    "hover:border-white/[0.12] transition-all duration-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}>
                      <Icon size={16} className={colors.text} />
                    </div>
                    {hasAlert && kpi.color !== 'emerald' && (
                      <div className={cn("h-2 w-2 rounded-full animate-pulse", `bg-${kpi.color}-400`)} />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{kpi.label}</p>
                    <p className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">{kpi.value}</p>
                  </div>
                </MotionCard>
              </Link>
            );
          })}
        </motion.div>

        {/* ── Team Activity + Upcoming Events ── */}
        <motion.div
          className="grid gap-4 lg:grid-cols-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Team Activity */}
          <MotionCard
            variants={cardVariants}
            className="lg:col-span-7 bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <Users size={14} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Équipe</h3>
              </div>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Voir tout <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 6).map((member: any, idx: number) => (
                  <div key={member.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-white/[0.05] flex items-center justify-center text-xs font-black text-white/50 uppercase">
                          {member.username?.slice(0, 2)}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A]",
                          member.is_online ? "bg-emerald-400" : "bg-white/20"
                        )} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{member.username}</p>
                        <p className="text-[10px] text-white/30">
                          {member.is_online ? "En ligne" : "Hors ligne"}
                          {" • Niv. " + (member.level || 1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white/40">{member.xp_total} XP</span>
                      {idx === 0 && <Crown size={12} className="text-yellow-400" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  Aucun membre trouvé
                </div>
              )}
            </div>
          </MotionCard>

          {/* Upcoming Events */}
          <MotionCard
            variants={cardVariants}
            className="lg:col-span-5 bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                  <CalendarDays size={14} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Événements à venir</h3>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Calendrier <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {eventsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" size={18} /></div>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{event.title}</p>
                        {event.description && (
                          <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{event.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn(
                          "text-[10px] font-black uppercase",
                          isToday(new Date(event.date)) ? "text-gold" : "text-white/40"
                        )}>
                          {getEventDateLabel(event.date)}
                        </p>
                        {event.time && (
                          <p className="text-[10px] text-white/30">{event.time}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  Aucun événement prévu
                </div>
              )}
            </div>
          </MotionCard>
        </motion.div>

        {/* ── Bottom Grid: Tasks + Orders + Hunter League ── */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
                        task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                      <p className="text-xs font-bold text-white truncate">{task.title}</p>
                    </div>
                    <button
                      onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: 'completed' })}
                      disabled={updateTaskStatusMutation.isPending}
                      className="shrink-0 h-6 w-6 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/10 flex items-center justify-center transition-all"
                    >
                      <CheckCircle2 size={12} className="text-white/20 hover:text-emerald-400" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-[10px] font-bold">
                  Tout est fait !
                </div>
              )}
            </div>
          </MotionCard>

          {/* Recent Orders (no amounts) */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                  <ShoppingBag size={14} className="text-blue-400" />
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
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{order.client_name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {order.created_at ? format(new Date(order.created_at), "dd MMM", { locale: fr }) : "-"} • {order.service_type}
                      </p>
                    </div>
                    <div className={cn(
                      "text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                      order.status === 'paid' || order.status === 'completed'
                        ? "bg-emerald-500/10 text-emerald-400"
                        : order.status === 'cancelled'
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    )}>
                      {order.status === 'paid' ? 'Payé' :
                       order.status === 'completed' ? 'Terminé' :
                       order.status === 'cancelled' ? 'Annulé' :
                       order.status === 'pending_payment' ? 'En attente' :
                       order.status}
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
