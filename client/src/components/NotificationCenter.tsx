import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Bell, MessageSquare, ShoppingCart, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "message" | "order";
  title: string;
  body: string;
  avatar?: string;
  time: Date;
  link: string;
  read: boolean;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const currentUserId = user?.id;
  const numericUserId = (user as any)?.numericId || (user as any)?.user_id;

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

  // Load initial notifications
  useEffect(() => {
    if (!currentUserId) return;

    const loadNotifications = async () => {
      const notifs: Notification[] = [];

      // Fetch recent unread DMs (last 20)
      const { data: dms } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, is_read")
        .eq("receiver_id", currentUserId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch sender profiles for DMs
      const senderIds = [...new Set((dms || []).map((m: any) => m.sender_id))];
      let profileMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", senderIds);
        (profiles || []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      (dms || []).forEach((m: any) => {
        const sender = profileMap[m.sender_id];
        notifs.push({
          id: `msg-${m.id}`,
          type: "message",
          title: sender?.username || "Message",
          body: m.content?.length > 60 ? m.content.slice(0, 60) + "..." : m.content,
          avatar: sender?.avatar_url,
          time: new Date(m.created_at),
          link: "/messages",
          read: false,
        });
      });

      // Fetch recent orders (last 10)
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const orders = await res.json();
          const recent = (orders || [])
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

          recent.forEach((o: any) => {
            notifs.push({
              id: `order-${o.id}`,
              type: "order",
              title: o.clientName,
              body: `${o.serviceType} - ${o.amount}€ (${o.status === "paid" ? "Payee" : o.status === "pending" ? "En attente" : "Annulee"})`,
              time: new Date(o.createdAt),
              link: "/orders",
              read: true, // orders are informational
            });
          });
        }
      } catch {}

      // Sort by time
      notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
      setNotifications(notifs);
    };

    loadNotifications();

    // Realtime: new DMs
    const dmChannel = supabase
      .channel("notif-dm")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id !== currentUserId || msg.sender_id === currentUserId) return;

        // Fetch sender profile
        const { data: sender } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", msg.sender_id)
          .single();

        setNotifications(prev => [{
          id: `msg-${msg.id}`,
          type: "message",
          title: sender?.username || "Message",
          body: msg.content?.length > 60 ? msg.content.slice(0, 60) + "..." : msg.content,
          avatar: sender?.avatar_url,
          time: new Date(msg.created_at),
          link: "/messages",
          read: false,
        }, ...prev].slice(0, 30));
      })
      .subscribe();

    // Realtime: new group messages
    const groupChannel = supabase
      .channel("notif-group")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === numericUserId) return;

        setNotifications(prev => [{
          id: `grp-${msg.id}`,
          type: "message",
          title: `${msg.sender_username} (Groupe)`,
          body: msg.content?.length > 60 ? msg.content.slice(0, 60) + "..." : msg.content,
          time: new Date(msg.created_at),
          link: "/messages",
          read: false,
        }, ...prev].slice(0, 30));
      })
      .subscribe();

    // Realtime: new/updated orders
    const orderChannel = supabase
      .channel("notif-orders")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const o = payload.new as any;
        setNotifications(prev => [{
          id: `order-${o.id}`,
          type: "order",
          title: o.client_name,
          body: `${o.service_type} - ${o.amount}€ (Nouvelle)`,
          time: new Date(o.created_at || Date.now()),
          link: "/orders",
          read: false,
        }, ...prev].slice(0, 30));
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const o = payload.new as any;
        const statusLabel = o.status === "paid" ? "Payee" : o.status === "pending" ? "En attente" : "Annulee";
        setNotifications(prev => [{
          id: `order-upd-${o.id}-${Date.now()}`,
          type: "order",
          title: o.client_name,
          body: `${o.service_type} - ${o.amount}€ (${statusLabel})`,
          time: new Date(),
          link: "/orders",
          read: false,
        }, ...prev].slice(0, 30));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [currentUserId, numericUserId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (notif: Notification) => {
    // Mark as read
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
    return `${days}j`;
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

      {/* Dropdown Panel - opens to the right on desktop */}
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
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Notifications</h3>
              <div className="flex items-center gap-2">
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
            <div className="overflow-y-auto max-h-[420px] custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] border-b border-white/[0.04] ${
                      !notif.read ? "bg-gold/[0.03]" : ""
                    }`}
                  >
                    {/* Icon / Avatar */}
                    {notif.type === "message" ? (
                      <Avatar className="h-9 w-9 border border-white/10 shrink-0 mt-0.5">
                        <AvatarImage src={notif.avatar} className="object-cover" />
                        <AvatarFallback className="bg-[#111] text-gold text-[10px] font-black">
                          {notif.title?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingCart size={16} className="text-gold" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold truncate ${!notif.read ? "text-white" : "text-white/60"}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-white/30 shrink-0">{formatTime(notif.time)}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 truncate ${!notif.read ? "text-white/50" : "text-white/30"}`}>
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
