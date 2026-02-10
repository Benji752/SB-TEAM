import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Bell, MessageSquare, ShoppingCart, CheckSquare, AlertCircle, Trophy, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

type NotifType = "message" | "order" | "task" | "ticket" | "xp";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  avatar?: string;
  time: Date;
  link: string;
  read: boolean;
}

const TYPE_ICONS: Record<NotifType, typeof MessageSquare> = {
  message: MessageSquare,
  order: ShoppingCart,
  task: CheckSquare,
  ticket: AlertCircle,
  xp: Trophy,
};

const TYPE_COLORS: Record<NotifType, string> = {
  message: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  order: "bg-gold/10 border-gold/20 text-gold",
  task: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  ticket: "bg-red-500/10 border-red-500/20 text-red-400",
  xp: "bg-green-500/10 border-green-500/20 text-green-400",
};

export function NotificationCenter() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [supaUserId, setSupaUserId] = useState<string | null>(null);
  const numericUserId = (user as any)?.numericId || (user as any)?.user_id;

  // Get the REAL Supabase auth UUID (not from useAuth which may return mock UUID)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: su } }) => {
      if (su?.id) setSupaUserId(su.id);
    });
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Load all notifications
  useEffect(() => {
    const userId = supaUserId || user?.id;
    if (!userId) return;

    const loadNotifications = async () => {
      const notifs: Notification[] = [];

      // ===== 1. UNREAD DMs =====
      try {
        const { data: dms } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at, is_read")
          .eq("receiver_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(15);

        // Get sender profiles
        const senderIds = [...new Set((dms || []).map((m: any) => m.sender_id))];
        let profileMap: Record<string, any> = {};
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", senderIds);
          (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
        }

        (dms || []).forEach((m: any) => {
          const sender = profileMap[m.sender_id];
          notifs.push({
            id: `msg-${m.id}`,
            type: "message",
            title: sender?.username || "Nouveau message",
            body: m.content?.length > 50 ? m.content.slice(0, 50) + "..." : m.content,
            avatar: sender?.avatar_url,
            time: new Date(m.created_at),
            link: "/messages",
            read: false,
          });
        });
      } catch (e) {
        console.error("[Notif] DM fetch error:", e);
      }

      // ===== 2. RECENT GROUP MESSAGES (last 5) =====
      try {
        const { data: groupMsgs } = await supabase
          .from("group_messages")
          .select("id, sender_id, sender_username, content, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        (groupMsgs || []).forEach((m: any) => {
          if (m.sender_id === numericUserId) return;
          notifs.push({
            id: `grp-${m.id}`,
            type: "message",
            title: `${m.sender_username} (Groupe)`,
            body: m.content?.length > 50 ? m.content.slice(0, 50) + "..." : m.content,
            time: new Date(m.created_at),
            link: "/messages",
            read: true,
          });
        });
      } catch (e) {
        console.error("[Notif] Group fetch error:", e);
      }

      // ===== 3. RECENT ORDERS (last 8 via API) =====
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const orders = await res.json();
          const recent = (orders || [])
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);

          recent.forEach((o: any) => {
            const statusLabel = o.status === "paid" ? "Payee" : o.status === "pending" ? "En attente" : "Annulee";
            const statusIcon = o.status === "paid" ? " ✓" : o.status === "pending" ? " ⏳" : " ✗";
            notifs.push({
              id: `order-${o.id}`,
              type: "order",
              title: `${o.clientName}${statusIcon}`,
              body: `${o.serviceType} - ${o.amount}€ (${statusLabel})`,
              time: new Date(o.createdAt),
              link: "/orders",
              read: true,
            });
          });
        }
      } catch (e) {
        console.error("[Notif] Orders fetch error:", e);
      }

      // ===== 4. TASKS ASSIGNED TO ME =====
      try {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, priority, is_done, due_date, created_at")
          .eq("is_done", false)
          .order("created_at", { ascending: false })
          .limit(5);

        (tasks || []).forEach((t: any) => {
          const priorityLabel = t.priority === "high" ? "🔴 " : t.priority === "medium" ? "🟡 " : "";
          const dueInfo = t.due_date ? ` - Echue le ${new Date(t.due_date).toLocaleDateString('fr-FR')}` : "";
          notifs.push({
            id: `task-${t.id}`,
            type: "task",
            title: `${priorityLabel}${t.title}`,
            body: `Tache en cours${dueInfo}`,
            time: new Date(t.created_at),
            link: "/tasks",
            read: true,
          });
        });
      } catch (e) {
        console.error("[Notif] Tasks fetch error:", e);
      }

      // ===== 5. RECENT TICKETS/COMPLAINTS =====
      try {
        const { data: tickets } = await supabase
          .from("tickets")
          .select("id, subject, priority, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        (tickets || []).forEach((t: any) => {
          notifs.push({
            id: `ticket-${t.id}`,
            type: "ticket",
            title: t.subject,
            body: `${t.priority === "urgent" ? "URGENT" : "Normal"} - En attente`,
            time: new Date(t.created_at),
            link: "/complaints",
            read: t.priority !== "urgent",
          });
        });
      } catch (e) {
        console.error("[Notif] Tickets fetch error:", e);
      }

      // ===== 6. XP / GAMIFICATION ACTIVITY =====
      try {
        const res = await fetch("/api/gamification/activity", { credentials: "include" });
        if (res.ok) {
          const activities = await res.json();
          const myActivities = (activities || [])
            .filter((a: any) => a.user_id === numericUserId)
            .slice(0, 5);

          myActivities.forEach((a: any) => {
            notifs.push({
              id: `xp-${a.id}`,
              type: "xp",
              title: `+${a.xp_gained} XP`,
              body: a.description,
              time: new Date(a.created_at),
              link: "/leaderboard",
              read: true,
            });
          });
        }
      } catch (e) {
        console.error("[Notif] XP fetch error:", e);
      }

      // Sort by time (most recent first), unread at top
      notifs.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.time.getTime() - a.time.getTime();
      });

      setNotifications(notifs);
    };

    loadNotifications();

    // ===== REALTIME SUBSCRIPTIONS =====

    // New DMs
    const dmChannel = supabase
      .channel("notif-center-dm")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id !== userId || msg.sender_id === userId) return;

        const { data: sender } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", msg.sender_id)
          .single();

        setNotifications(prev => [{
          id: `msg-${msg.id}`,
          type: "message" as NotifType,
          title: sender?.username || "Nouveau message",
          body: msg.content?.length > 50 ? msg.content.slice(0, 50) + "..." : msg.content,
          avatar: sender?.avatar_url,
          time: new Date(msg.created_at),
          link: "/messages",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .subscribe();

    // New group messages
    const groupChannel = supabase
      .channel("notif-center-group")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === numericUserId) return;

        setNotifications(prev => [{
          id: `grp-${msg.id}`,
          type: "message" as NotifType,
          title: `${msg.sender_username} (Groupe)`,
          body: msg.content?.length > 50 ? msg.content.slice(0, 50) + "..." : msg.content,
          time: new Date(msg.created_at),
          link: "/messages",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .subscribe();

    // New orders or status changes
    const orderChannel = supabase
      .channel("notif-center-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as any;
        setNotifications(prev => [{
          id: `order-new-${o.id}`,
          type: "order" as NotifType,
          title: `${o.client_name} ⏳`,
          body: `Nouvelle commande - ${o.service_type} - ${o.amount}€`,
          time: new Date(o.created_at || Date.now()),
          link: "/orders",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as any;
        const statusLabel = o.status === "paid" ? "Payee ✓" : o.status === "cancelled" ? "Annulee ✗" : "Mise a jour";
        setNotifications(prev => [{
          id: `order-upd-${o.id}-${Date.now()}`,
          type: "order" as NotifType,
          title: `${o.client_name} - ${statusLabel}`,
          body: `${o.service_type} - ${o.amount}€`,
          time: new Date(),
          link: "/orders",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .subscribe();

    // New tasks
    const taskChannel = supabase
      .channel("notif-center-tasks")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) => {
        const t = payload.new as any;
        setNotifications(prev => [{
          id: `task-new-${t.id}`,
          type: "task" as NotifType,
          title: t.title,
          body: `Nouvelle tache - Priorite ${t.priority === "high" ? "haute" : t.priority === "medium" ? "moyenne" : "basse"}`,
          time: new Date(t.created_at || Date.now()),
          link: "/tasks",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .subscribe();

    // New tickets
    const ticketChannel = supabase
      .channel("notif-center-tickets")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tickets" }, (payload) => {
        const t = payload.new as any;
        setNotifications(prev => [{
          id: `ticket-new-${t.id}`,
          type: "ticket" as NotifType,
          title: t.subject,
          body: `${t.priority === "urgent" ? "URGENT" : "Normal"} - Nouvelle reclamation`,
          time: new Date(t.created_at || Date.now()),
          link: "/complaints",
          read: false,
        }, ...prev].slice(0, 40));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [supaUserId, user?.id, numericUserId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (notif: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );
    navigate(notif.link);
    setOpen(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "maintenant";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-white/[0.05] transition-colors group"
      >
        <Bell size={20} className="text-white/50 group-hover:text-gold transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
            <span className="text-[8px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto top-20 md:top-full md:mt-2 w-auto md:w-[360px] max-h-[70vh] md:max-h-[500px] bg-[#0A0A0A] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">{unreadCount}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-gold hover:text-gold/80 uppercase tracking-widest transition-colors"
                  >
                    Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[420px] custom-scrollbar divide-y divide-white/[0.04]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type];
                  const colorClass = TYPE_COLORS[notif.type];

                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                        !notif.read ? "bg-gold/[0.04]" : ""
                      }`}
                    >
                      {/* Icon / Avatar */}
                      {notif.type === "message" && notif.avatar ? (
                        <Avatar className="h-9 w-9 border border-white/10 shrink-0 mt-0.5">
                          <AvatarImage src={notif.avatar} className="object-cover" />
                          <AvatarFallback className="bg-[#111] text-gold text-[10px] font-black">
                            {notif.title?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                          <Icon size={15} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${!notif.read ? "text-white" : "text-white/50"}`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-white/25 shrink-0">{formatTime(notif.time)}</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 truncate ${!notif.read ? "text-white/40" : "text-white/25"}`}>
                          {notif.body}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
