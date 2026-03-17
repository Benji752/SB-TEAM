import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  Users,
  ArrowRight,
  Zap,
  MessageSquare,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  FolderOpen,
  Sparkles,
  Plus,
  ClipboardList,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { LeadValidation } from "@/components/LeadValidation";
import { useGamificationData } from "@/hooks/useGamificationData";
import { useGlobalUnread } from "@/hooks/useGlobalUnread";
import { Trophy, Crown, Medal, Award } from "lucide-react";

/* ── Animation Variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 16 }
  }
};

const quickActionVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

const MotionCard = motion(Card);

/* ── Animated Counter ── */
function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      });
      return controls.stop;
    }
  }, [isInView, value, motionVal, duration]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsub;
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

/* ── Skeleton Loader ── */
function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
          <div className="h-8 w-8 rounded-full bg-white/[0.04] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-white/[0.04] animate-pulse" />
            <div className="h-2 w-1/3 rounded bg-white/[0.03] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Quick Actions ── */
const quickActions = [
  { label: "Tâche", icon: Plus, href: "/tasks", color: "amber" },
  { label: "Message", icon: MessageSquare, href: "/messages", color: "blue" },
  { label: "Commande", icon: ShoppingBag, href: "/orders", color: "emerald" },
  { label: "Calendrier", icon: CalendarDays, href: "/calendar", color: "purple" },
  { label: "Drive", icon: FolderOpen, href: "/drive", color: "cyan" },
  { label: "IA Studio", icon: Sparkles, href: "/ia-studio", color: "pink" },
];

const actionColorMap: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 hover:shadow-amber-500/10",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 hover:shadow-blue-500/10",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:shadow-emerald-500/10",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 hover:shadow-purple-500/10",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 hover:shadow-cyan-500/10",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/30 hover:shadow-pink-500/10",
};

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth();
  const { leaderboard } = useGamificationData();
  const unreadCount = useGlobalUnread();

  // Tasks
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

  const onlineCount = leaderboard.filter((m: any) => m.is_online).length;

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const is_done = status === 'completed';
      const { error } = await supabase.from('tasks').update({ is_done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks-count"] });
    },
  });

  const kpiCards = [
    { label: "Tâches en cours", value: openTasksCount ?? 0, icon: ClipboardList, color: "amber", href: "/tasks" },
    { label: "Messages non lus", value: unreadCount ?? 0, icon: MessageSquare, color: "blue", href: "/messages" },
    { label: "Équipe en ligne", value: onlineCount, icon: Users, color: "emerald", href: "/leaderboard" },
    { label: "Tickets ouverts", value: openTicketsCount ?? 0, icon: AlertCircle, color: "red", href: "/reclamations" },
  ];

  const kpiColorMap: Record<string, { bg: string; text: string; border: string; pulse: string }> = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", pulse: "bg-amber-400" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", pulse: "bg-blue-400" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", pulse: "bg-emerald-400" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", pulse: "bg-red-400" },
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Bonjour, <motion.span
                className="text-gold inline-block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {user?.username || 'Team'}
              </motion.span>
            </h1>
            <motion.p
              className="text-white/30 text-xs mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}
            </motion.p>
          </div>
        </motion.div>

        {/* ── Quick Actions Bar ── */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.label} variants={quickActionVariants}>
                <Link href={action.href}>
                  <button className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold whitespace-nowrap",
                    "transition-all duration-300 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]",
                    actionColorMap[action.color]
                  )}>
                    <Icon size={14} />
                    {action.label}
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── KPI Cards Row ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpiCards.map((kpi) => {
            const colors = kpiColorMap[kpi.color];
            const Icon = kpi.icon;
            const hasAlert = typeof kpi.value === 'number' && kpi.value > 0 && kpi.color !== 'emerald';
            return (
              <Link key={kpi.label} href={kpi.href}>
                <MotionCard
                  variants={cardVariants}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "bg-[#0A0A0A] border-white/[0.05] p-4 md:p-5 rounded-2xl flex flex-col gap-3 cursor-pointer",
                    "hover:border-white/[0.15] transition-colors duration-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <motion.div
                      className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}
                      whileHover={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon size={16} className={colors.text} />
                    </motion.div>
                    {hasAlert && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors.pulse)} />
                        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", colors.pulse)} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{kpi.label}</p>
                    <p className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">
                      <AnimatedNumber value={kpi.value as number} />
                    </p>
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
            className="lg:col-span-7 bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <Users size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Équipe</h3>
                  <p className="text-[10px] text-white/30">{onlineCount} en ligne</p>
                </div>
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
                  <motion.div
                    key={member.id || idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-all cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-white/[0.05] flex items-center justify-center text-xs font-black text-white/50 uppercase">
                          {member.username?.slice(0, 2)}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A]",
                          member.is_online ? "bg-emerald-400" : "bg-white/20"
                        )}>
                          {member.is_online && (
                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                          )}
                        </div>
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
                      {idx === 0 && (
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}>
                          <Crown size={12} className="text-yellow-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <SkeletonRow count={4} />
              )}
            </div>
          </MotionCard>

          {/* Upcoming Events */}
          <MotionCard
            variants={cardVariants}
            className="lg:col-span-5 bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                  <CalendarDays size={14} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Événements</h3>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-white text-[9px] font-bold h-7 gap-1">
                  Calendrier <ArrowRight size={10} />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5">
              {eventsLoading ? (
                <SkeletonRow count={3} />
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any, idx: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.06 }}
                    whileHover={{ x: -4, backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-all cursor-default"
                  >
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
                        {event.time && <p className="text-[10px] text-white/30">{event.time}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 text-white/15 text-[10px] font-bold">
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
          {/* Tasks */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors duration-300">
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
                <SkeletonRow count={4} />
              ) : recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((task: any, idx: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.04 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                      <p className="text-xs font-bold text-white truncate">{task.title}</p>
                    </div>
                    <motion.button
                      onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: 'completed' })}
                      disabled={updateTaskStatusMutation.isPending}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      className="shrink-0 h-6 w-6 rounded-md bg-white/[0.03] border border-white/[0.06] group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all"
                    >
                      <CheckCircle2 size={12} className="text-white/20 group-hover:text-emerald-400 transition-colors" />
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-10 text-white/15 text-[10px] font-bold"
                >
                  Tout est fait !
                </motion.div>
              )}
            </div>
          </MotionCard>

          {/* Orders (no amounts) */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors duration-300">
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
                <SkeletonRow count={4} />
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any, idx: number) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.04 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                  >
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
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 text-white/15 text-[10px] font-bold">
                  Aucune commande récente
                </div>
              )}
            </div>
          </MotionCard>

          {/* Hunter League */}
          <MotionCard variants={cardVariants} className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="h-8 w-8 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-lg flex items-center justify-center border border-yellow-500/20"
                  animate={{ boxShadow: ["0 0 0px rgba(234,179,8,0)", "0 0 12px rgba(234,179,8,0.15)", "0 0 0px rgba(234,179,8,0)"] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Trophy size={14} className="text-yellow-400" />
                </motion.div>
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
                  <Crown key="c" size={14} className="text-yellow-400" />,
                  <Medal key="m" size={14} className="text-gray-300" />,
                  <Award key="a" size={14} className="text-amber-600" />,
                ];
                return (
                  <motion.div
                    key={entry.id || idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.06 }}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-default",
                      idx === 0
                        ? "bg-yellow-500/[0.06] border-yellow-500/15"
                        : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                    )}
                  >
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
                  </motion.div>
                );
              })}
              {leaderboard.length === 0 && (
                <SkeletonRow count={3} />
              )}
            </div>
          </MotionCard>
        </motion.div>

        {/* ── Lead Validation (Admin only) ── */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          >
            <LeadValidation />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
