import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2, Eye, EyeOff, Users, User, ArrowLeft, Send, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useGamificationData } from "@/hooks/useGamificationData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export default function Messages() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState(false);
  const [adminViewUser1, setAdminViewUser1] = useState<any>(null);
  const [adminViewUser2, setAdminViewUser2] = useState<any>(null);
  const [chatMode, setChatMode] = useState<'dm' | 'group'>('group');
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('chat');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>({});
  const [unreadGroup, setUnreadGroup] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<any>(null);
  const chatModeRef = useRef<'dm' | 'group'>('group');

  const { isUserOnline } = useGamificationData();

  // Keep refs in sync
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(scrollRef); }, [messages, scrollToBottom]);
  useEffect(() => { scrollToBottom(groupScrollRef); }, [groupMessages, scrollToBottom]);

  // ========== INIT ==========
  useEffect(() => {
    async function init() {
      try {
        setIsLoadingProfiles(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setIsAdmin(profile?.role === 'admin');
          setCurrentUserProfile(profile);
        }

        await fetchProfiles(user?.id);
        await fetchGroupMessages();
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setIsLoadingProfiles(false);
      }
    }
    init();
  }, []);

  // ========== SUPABASE REALTIME ==========
  useEffect(() => {
    if (!currentUser) return;

    // Channel for DM messages (INSERT + UPDATE for read status)
    const dmChannel = supabase
      .channel('dm-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMsg = payload.new as any;
        const isForMe = newMsg.receiver_id === currentUser.id || newMsg.sender_id === currentUser.id;
        if (!isForMe) return;

        const sel = selectedUserRef.current;
        if (chatModeRef.current === 'dm' && sel) {
          const isInConvo =
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === sel.id) ||
            (newMsg.sender_id === sel.id && newMsg.receiver_id === currentUser.id);
          if (isInConvo) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Auto mark as read if it's incoming and we're viewing the convo
            if (newMsg.sender_id !== currentUser.id) {
              supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
            }
          }
        }

        // Notification: only if not viewing this convo right now
        if (newMsg.sender_id !== currentUser.id) {
          const sel = selectedUserRef.current;
          const isViewingThisConvo = chatModeRef.current === 'dm' && sel?.id === newMsg.sender_id;
          if (!isViewingThisConvo) {
            playNotificationSound();
            setUnreadCount(prev => prev + 1);
            setUnreadBySender(prev => ({
              ...prev,
              [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
            }));
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const updated = payload.new as any;
        // Update is_read status in local state (for "Vu" indicator)
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m));
      })
      .subscribe();

    // Channel for group messages
    const groupChannel = supabase
      .channel('group-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
      }, (payload) => {
        const newMsg = payload.new as any;
        setGroupMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Notification if not from me and not currently viewing group chat
        if (newMsg.sender_id !== currentUser.id) {
          const isViewingGroup = chatModeRef.current === 'group';
          if (!isViewingGroup) {
            playNotificationSound();
            setUnreadCount(prev => prev + 1);
            setUnreadGroup(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [currentUser?.id]);

  // ========== FETCH FUNCTIONS ==========
  async function fetchProfiles(currentUserId: string | undefined) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;

      const filtered = adminViewMode ? (data || []) : (data || []).filter(p => p.id !== currentUserId);
      setProfiles(filtered);

      if (selectedUser) {
        const updated = data?.find(p => p.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch {}
  }

  async function fetchGroupMessages() {
    try {
      setIsLoadingGroupMessages(true);
      // Fetch directly from Supabase for real-time compatibility
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      setGroupMessages(data || []);
    } catch {
      // Fallback to API
      try {
        const response = await fetch('/api/group-messages');
        if (response.ok) {
          const data = await response.json();
          setGroupMessages(data || []);
        }
      } catch {}
    } finally {
      setIsLoadingGroupMessages(false);
    }
  }

  async function fetchMessages(recipientId: string) {
    if (!currentUser) return;
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark incoming messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', recipientId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function fetchAdminMessages(user1Id: string, user2Id: string) {
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch {} finally {
      setIsLoadingMessages(false);
    }
  }

  // ========== SEND FUNCTIONS ==========
  async function handleSendGroupMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !currentUserProfile) return;

    const text = messageText.trim();
    setMessageText("");

    try {
      // Insert directly into Supabase (Realtime will pick it up)
      const { error } = await supabase
        .from('group_messages')
        .insert({
          sender_id: currentUser.id,
          sender_username: currentUserProfile.username,
          content: text,
        });

      if (error) {
        // Fallback to API
        await fetch('/api/group-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser.id,
            senderUsername: currentUserProfile.username,
            content: text,
          }),
          credentials: 'include',
        });
        // Refetch since Realtime won't catch API inserts from server
        await fetchGroupMessages();
      }
    } catch {
      setMessageText(text); // Restore on error
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    const text = messageText.trim();
    setMessageText("");

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: text,
          is_read: false,
        });

      if (error) {
        if (error.message?.includes("Auth session missing")) {
          window.location.replace('/');
          return;
        }
        throw error;
      }
      // Realtime subscription will add the message to state
    } catch (err: any) {
      console.error("Error sending message:", err);
      setMessageText(text); // Restore on error
    }
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    if (adminViewMode && adminViewUser1 && adminViewUser2) {
      fetchAdminMessages(adminViewUser1.id, adminViewUser2.id);
    }
  }, [adminViewMode, adminViewUser1, adminViewUser2]);

  useEffect(() => {
    if (selectedUser && currentUser && !adminViewMode) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser?.id, currentUser?.id]);

  // ========== RENDER ==========
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar */}
        <Card className={`w-full md:w-96 flex flex-col glass-card border-none rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.02] ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-6 border-b border-white/[0.05]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-white">Messages</h2>
                {unreadCount > 0 && (
                  <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-[9px] font-black text-white">{unreadCount}</span>
                  </div>
                )}
              </div>
              {isAdmin && chatMode === 'dm' && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setAdminViewMode(!adminViewMode);
                    setMessages([]);
                    setSelectedUser(null);
                    setAdminViewUser1(null);
                    setAdminViewUser2(null);
                  }}
                  className={`${adminViewMode ? 'text-gold bg-gold/20' : 'text-muted-foreground'}`}
                  title={adminViewMode ? "Mode normal" : "Mode observateur admin"}
                >
                  {adminViewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setChatMode('group'); setAdminViewMode(false); setUnreadGroup(0); }}
                className={`flex-1 gap-2 relative ${chatMode === 'group' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-muted-foreground'}`}
              >
                <Users size={16} />
                Chat Équipe
                {unreadGroup > 0 && chatMode !== 'group' && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                    <span className="text-[9px] font-black text-white">{unreadGroup}</span>
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setChatMode('dm'); setMobileView('contacts'); }}
                className={`flex-1 gap-2 relative ${chatMode === 'dm' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-muted-foreground'}`}
              >
                <User size={16} />
                Privé
                {Object.values(unreadBySender).reduce((a, b) => a + b, 0) > 0 && chatMode !== 'dm' && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                    <span className="text-[9px] font-black text-white">{Object.values(unreadBySender).reduce((a, b) => a + b, 0)}</span>
                  </span>
                )}
              </Button>
            </div>

            {adminViewMode && chatMode === 'dm' && (
              <div className="mt-4 p-3 bg-gold/10 rounded-xl border border-gold/20">
                <div className="text-xs text-gold font-bold uppercase tracking-wider mb-2">Mode Observateur Admin</div>
                <div className="space-y-2">
                  <Select onValueChange={(val) => setAdminViewUser1(profiles.find(p => p.id === val))}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-9">
                      <SelectValue placeholder="Utilisateur 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(val) => setAdminViewUser2(profiles.find(p => p.id === val))}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-9">
                      <SelectValue placeholder="Utilisateur 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.filter(p => p.id !== adminViewUser1?.id).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Contact list (DM mode) */}
          {chatMode === 'dm' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoadingProfiles ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-gold" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Aucun membre trouvé</div>
            ) : (
              profiles.map((profile) => {
                const online = isUserOnline(profile.user_id ?? 0);
                return (
                  <div
                    key={profile.id}
                    onClick={() => {
                      setSelectedUser(profile);
                      setMobileView('chat');
                      // Clear unread badge for this sender
                      const senderUnread = unreadBySender[profile.id] || 0;
                      if (senderUnread > 0) {
                        setUnreadBySender(prev => ({ ...prev, [profile.id]: 0 }));
                        setUnreadCount(prev => Math.max(0, prev - senderUnread));
                      }
                    }}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all rounded-2xl border border-transparent ${
                      selectedUser?.id === profile.id ? 'bg-gold/10 border-gold/20' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="relative z-0">
                      <Avatar className="h-12 w-12 border border-white/10 overflow-hidden">
                        <AvatarImage src={profile.avatar_url || ""} className="object-cover w-full h-full" />
                        <AvatarFallback className="bg-white/[0.05] text-gold font-bold">
                          {profile.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#050505] rounded-full shadow-lg z-10 ${
                        online ? 'bg-[#10B981]' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{profile.username}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{profile.role}</div>
                    </div>
                    {(unreadBySender[profile.id] || 0) > 0 && (
                      <div className="h-6 min-w-[24px] px-1.5 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                        <span className="text-[10px] font-black text-white">{unreadBySender[profile.id]}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          )}

          {/* Group info (group mode) */}
          {chatMode === 'group' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-16 w-16 bg-gold/10 rounded-full flex items-center justify-center mb-4 border border-gold/20">
                <Users size={28} className="text-gold" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Chat Équipe</h3>
              <p className="text-sm text-muted-foreground">Messages en temps réel pour toute l'équipe.</p>
              <div className="mt-4 flex gap-2">
                {profiles.map(p => (
                  <div key={p.id} className="relative">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={p.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-white/[0.05] text-gold text-xs font-bold">{p.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-[#050505] rounded-full ${
                      isUserOnline(p.user_id ?? 0) ? 'bg-[#10B981]' : 'bg-gray-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Chat area */}
        <Card className={`flex-1 flex flex-col glass-card border-none rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.02] ${mobileView === 'contacts' ? 'hidden md:flex' : 'flex'}`}>
          {/* Group Chat */}
          {chatMode === 'group' ? (
            <>
              <div className="p-4 md:p-6 border-b border-white/[0.05] flex items-center gap-3 md:gap-4 bg-gradient-to-r from-gold/10 to-transparent">
                <Button variant="ghost" size="icon" onClick={() => setMobileView('contacts')} className="md:hidden text-white/60">
                  <ArrowLeft size={20} />
                </Button>
                <div className="h-10 w-10 bg-gold/20 rounded-full flex items-center justify-center border border-gold/30">
                  <Users size={20} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">Chat Équipe SB Digital</h3>
                  <p className="text-[10px] md:text-xs text-emerald-400 font-bold">En temps réel</p>
                </div>
              </div>

              <div ref={groupScrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar">
                {isLoadingGroupMessages && groupMessages.length === 0 ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>
                ) : groupMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 italic">
                    <MessageSquare size={48} className="mb-4" />
                    <p>Aucun message. Soyez le premier à écrire !</p>
                  </div>
                ) : (
                  groupMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                          isMe
                            ? 'self-end bg-gold text-black rounded-tr-none shadow-[0_5px_15px_rgba(201,162,77,0.1)]'
                            : 'self-start bg-white/[0.05] text-white rounded-tl-none border border-white/[0.08]'
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] font-bold mb-1 text-gold">{msg.sender_username}</div>
                        )}
                        <div className="font-medium break-words">{msg.content}</div>
                        <div className={`text-[9px] mt-1 opacity-50 text-right ${isMe ? 'text-black/70' : 'text-white/50'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendGroupMessage} className="p-4 md:p-6 border-t border-white/[0.05] flex gap-3 bg-white/[0.01]">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Écrivez à l'équipe..."
                  className="flex-1 bg-black/40 border-white/[0.1] text-white h-12 rounded-xl px-4 focus:border-gold/50"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="luxury-button h-12 px-6 rounded-xl"
                >
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : adminViewMode && adminViewUser1 && adminViewUser2 ? (
            /* Admin view mode */
            <>
              <div className="p-6 border-b border-white/[0.05] flex items-center gap-4 bg-gold/5">
                <Eye size={20} className="text-gold" />
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-white/[0.05] text-gold font-bold text-xs">{adminViewUser1.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-white font-bold">{adminViewUser1.username}</span>
                  <span className="text-muted-foreground mx-2">↔</span>
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-white/[0.05] text-gold font-bold text-xs">{adminViewUser2.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-white font-bold">{adminViewUser2.username}</span>
                </div>
                <div className="ml-auto text-xs text-gold/70 uppercase tracking-wider">Lecture Seule</div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 custom-scrollbar">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 italic">
                    <MessageSquare size={48} className="mb-4" />
                    <p>Aucun message entre ces utilisateurs.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromUser1 = msg.sender_id === adminViewUser1.id;
                    const senderName = isFromUser1 ? adminViewUser1.username : adminViewUser2.username;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                          isFromUser1
                            ? 'self-start bg-blue-500/20 text-white rounded-tl-none border border-blue-500/30'
                            : 'self-end bg-purple-500/20 text-white rounded-tr-none border border-purple-500/30'
                        }`}
                      >
                        <div className="text-[10px] font-bold mb-1 opacity-70">{senderName}</div>
                        <div className="font-medium break-words">{msg.content}</div>
                        <div className="text-[9px] mt-1 opacity-50 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-6 border-t border-white/[0.05] bg-white/[0.01] text-center text-muted-foreground text-sm">
                Mode observateur - Lecture seule
              </div>
            </>
          ) : selectedUser && !adminViewMode ? (
            /* DM Chat */
            <>
              <div className="p-4 md:p-6 border-b border-white/[0.05] flex items-center gap-3 md:gap-4 bg-white/[0.01]">
                <Button variant="ghost" size="icon" onClick={() => setMobileView('contacts')} className="md:hidden text-white/60">
                  <ArrowLeft size={20} />
                </Button>
                <div className="relative z-0">
                  <Avatar className="h-10 w-10 border border-white/10 overflow-hidden">
                    <AvatarImage src={selectedUser.avatar_url || ""} className="object-cover w-full h-full" />
                    <AvatarFallback className="bg-white/[0.05] text-gold font-bold">{selectedUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#050505] rounded-full shadow-lg z-10 ${
                    isUserOnline(selectedUser.user_id ?? 0) ? 'bg-[#10B981]' : 'bg-gray-500'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedUser.username}</h3>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${
                    isUserOnline(selectedUser.user_id ?? 0) ? 'text-[#10B981]' : 'text-gray-500'
                  }`}>
                    {isUserOnline(selectedUser.user_id ?? 0) ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 custom-scrollbar">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 italic">
                    <MessageSquare size={48} className="mb-4" />
                    <p>Aucun message. Commencez la discussion !</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                          isMe
                            ? 'self-end bg-gold text-black rounded-tr-none shadow-[0_5px_15px_rgba(201,162,77,0.1)]'
                            : 'self-start bg-white/[0.05] text-white rounded-tl-none border border-white/[0.08]'
                        }`}
                      >
                        <div className="font-medium break-words">{msg.content}</div>
                        <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            <span className={`font-bold ${msg.is_read ? 'text-blue-600' : 'opacity-40'}`}>
                              {msg.is_read ? 'Vu' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-4 md:p-6 border-t border-white/[0.05] flex gap-3 bg-white/[0.01]">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-black/40 border-white/[0.1] text-white h-12 rounded-xl px-4 focus:border-gold/50"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="luxury-button h-12 px-6 rounded-xl"
                >
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="h-20 w-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05] text-gold">
                  {adminViewMode ? <Eye size={32} /> : <MessageSquare size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {adminViewMode ? "Sélectionnez deux utilisateurs" : "Sélectionnez une conversation"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {adminViewMode ? "Choisissez deux membres pour voir leur conversation." : "Choisissez un membre pour commencer à discuter."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setMobileView('contacts')}
                  className="md:hidden border-gold/30 text-gold"
                >
                  <Users size={16} className="mr-2" />
                  Voir les contacts
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
