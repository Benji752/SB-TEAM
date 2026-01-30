import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Send, Loader2, CheckCheck, Users, ShieldAlert, MessageSquare } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";

export default function Messages() {
  const { user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [generalUnreadCount, setGeneralUnreadCount] = useState(0);
  const [isSupervision, setIsSupervision] = useState(false);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    contacts, 
    allConversations,
    chatMessages, 
    isLoadingContacts, 
    isLoadingMessages, 
    isLoadingSupervision,
    sendMessage,
    markAsRead 
  } = useMessages(
    selectedContactId || undefined, 
    selectedChannelId || undefined, 
    isSupervision
  );

  // Sync initial messages from react-query to local state
  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  // Supabase Realtime Subscription for Instant UI Updates
  useEffect(() => {
    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Nouveau message reçu:', payload);
          const newMsg = payload.new;
          
          // Logic to determine if message belongs to current view
          const isCurrentChannel = selectedChannelId && newMsg.channel_id === selectedChannelId;
          const isCurrentDirect = selectedContactId && !isSupervision && (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedContactId) ||
            (newMsg.sender_id === selectedContactId && newMsg.receiver_id === user?.id)
          );
          const isCurrentSupervision = isSupervision && selectedContactId && (
            (() => {
              const [id1, id2] = selectedContactId.split('-');
              return (newMsg.sender_id === id1 && newMsg.receiver_id === id2) ||
                     (newMsg.sender_id === id2 && newMsg.receiver_id === id1);
            })()
          );

          if (isCurrentChannel || isCurrentDirect || isCurrentSupervision) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          // Handle General Channel Unread Notifications
          if (newMsg.channel_id === 'general' && selectedChannelId !== 'general') {
            setGeneralUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContactId, selectedChannelId, isSupervision, user?.id]);

  useEffect(() => {
    if (selectedContactId && !isSupervision && messages.length > 0) {
      markAsRead.mutate();
    }
  }, [selectedContactId, messages.length, isSupervision]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || (!selectedContactId && !selectedChannelId) || isSupervision) return;

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error("Erreur d'authentification : " + authError?.message);

      await sendMessage.mutateAsync(messageText);
      setMessageText("");
    } catch (err: any) {
      alert("Erreur lors de l'envoi : " + err.message);
    }
  };

  const filteredContacts = contacts?.filter((c: any) => 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const getUsername = (id: string) => contacts?.find((c: any) => c.id === id)?.username || "Utilisateur";
  const getAvatar = (id: string) => contacts?.find((c: any) => c.id === id)?.avatar_url;

  const getChatHeader = () => {
    if (selectedChannelId === 'general') {
      return { name: '📢 Général - Team', status: 'Discussion de groupe', avatar: null };
    }
    if (isSupervision && selectedContactId) {
      const [id1, id2] = selectedContactId.split('-');
      return { name: `${getUsername(id1)} ↔ ${getUsername(id2)}`, status: 'Mode Supervision (Lecture seule)', avatar: null };
    }
    const contact = contacts?.find((c: any) => c.id === selectedContactId);
    return { name: contact?.username || '...', status: 'En ligne', avatar: contact?.avatar_url };
  };

  const header = getChatHeader();

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6">
        {/* Chat List */}
        <Card className="w-96 flex flex-col glass-card border-none rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/[0.05] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            {user?.role === 'admin' && (
              <Button 
                onClick={() => {
                  setIsSupervision(!isSupervision);
                  setSelectedContactId(null);
                  setSelectedChannelId(null);
                }}
                variant={isSupervision ? "default" : "ghost"}
                className={`h-10 px-4 rounded-xl flex gap-2 font-bold uppercase text-[10px] tracking-widest ${isSupervision ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gold'}`}
              >
                <ShieldAlert size={16} /> {isSupervision ? 'Quitter' : 'Supervision'}
              </Button>
            )}
          </div>
          
          {!isSupervision && (
            <div className="p-6 border-b border-white/[0.05]">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 bg-black/40 border-white/[0.08] text-white h-12 rounded-xl" 
                  placeholder="Rechercher un profil..." 
                />
              </div>

              <div 
                onClick={() => {
                  setSelectedChannelId('general');
                  setSelectedContactId(null);
                  setGeneralUnreadCount(0);
                }}
                className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border border-gold/10 ${selectedChannelId === 'general' ? 'bg-gold/10 border-gold/30' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="h-10 w-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold relative">
                  <Users size={20} />
                  {generalUnreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-lg shadow-red-500/20">
                      {generalUnreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-white">📢 Général - Team</div>
                    <div className="text-[10px] text-gold uppercase tracking-widest font-black">Canal Public</div>
                  </div>
                  {generalUnreadCount > 0 && (
                    <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-red-500/20">
                      {generalUnreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isSupervision ? (
              isLoadingSupervision ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
              ) : allConversations?.map((conv: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedContactId(`${conv.id1}-${conv.id2}`)}
                  className={`p-6 flex items-center gap-5 cursor-pointer border-b border-white/[0.03] last:border-0 ${selectedContactId === `${conv.id1}-${conv.id2}` ? 'bg-red-500/10' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex -space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-black">
                      <AvatarImage src={getAvatar(conv.id1)} />
                      <AvatarFallback>{getUsername(conv.id1)[0]}</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 border-2 border-black">
                      <AvatarImage src={getAvatar(conv.id2)} />
                      <AvatarFallback>{getUsername(conv.id2)[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">{getUsername(conv.id1)} ↔ {getUsername(conv.id2)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">Conversation privée</div>
                  </div>
                </div>
              ))
            ) : (
              isLoadingContacts ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
              ) : filteredContacts?.map((contact: any) => (
                <div 
                  key={contact.id} 
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    setSelectedChannelId(null);
                  }}
                  className={`p-6 flex items-center gap-5 cursor-pointer transition-all border-b border-white/[0.03] last:border-0 ${selectedContactId === contact.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}
                >
                  <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
                    <AvatarImage src={contact.avatar_url || ""} />
                    <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">{contact.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-base text-white">{contact.username}</span>
                      <div className="flex items-center gap-2">
                        {contact.unreadCount > 0 && (
                          <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-red-500/20">
                            {contact.unreadCount}
                          </div>
                        )}
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 ${contact.role === 'admin' ? 'text-red-400' : 'text-muted-foreground'}`}>{contact.role}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground/60 truncate font-medium">Cliquer pour discuter</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        {selectedContactId || selectedChannelId ? (
          <Card className={`flex-1 flex flex-col glass-card border-none rounded-3xl overflow-hidden bg-white/[0.02] ${isSupervision ? 'border-2 border-red-500/20' : ''}`}>
            <div className={`p-8 border-b border-white/[0.05] flex items-center gap-5 backdrop-blur-md ${isSupervision ? 'bg-red-500/5' : ''}`}>
              {header.avatar ? (
                <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
                  <AvatarImage src={header.avatar} />
                  <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">{header.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : (
                <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 border-white/[0.05] ${isSupervision ? 'bg-red-500/20 text-red-500' : 'bg-gold/20 text-gold'}`}>
                  {isSupervision ? <ShieldAlert size={24} /> : <Users size={24} />}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg text-white">{header.name}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest ${isSupervision ? 'text-red-400' : 'text-gold'}`}>{header.status}</p>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto">
              {(isLoadingMessages && messages.length === 0) ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
              ) : messages?.map((msg: any) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[70%] px-6 py-4 rounded-[24px] text-sm font-semibold shadow-2xl ${
                    msg.sender_id === user?.id 
                      ? 'self-end bg-gold text-black rounded-tr-none shadow-gold/10' 
                      : 'self-start bg-white/[0.03] text-white/90 rounded-tl-none border border-white/[0.05]'
                  }`}
                >
                  {msg.channel_id === 'general' && msg.sender_id !== user?.id && (
                    <div className="text-[10px] text-gold uppercase font-black mb-1">{getUsername(msg.sender_id)}</div>
                  )}
                  {msg.content}
                  {!isSupervision && msg.sender_id === user?.id && (
                    <div className="flex justify-end mt-1 opacity-50">
                      {msg.is_read ? <CheckCheck size={14} className="text-black" /> : <div className="text-[10px]">Envoyé</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isSupervision && (
              <form onSubmit={handleSend} className="p-8 border-t border-white/[0.05] flex gap-4 backdrop-blur-md">
                <Input 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Tapez votre message..." 
                  className="flex-1 bg-black/40 border-white/[0.08] text-white h-14 rounded-2xl px-6" 
                />
                <Button type="submit" size="icon" className="luxury-button h-14 w-14"><Send size={24} /></Button>
              </form>
            )}
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center glass-card border-none rounded-3xl bg-white/[0.02]">
            <div className="text-center">
              <div className={`h-20 w-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05] ${isSupervision ? 'text-red-500' : 'text-gold'}`}>
                {isSupervision ? <ShieldAlert size={32} /> : <MessageSquare size={32} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isSupervision ? 'Mode Supervision Actif' : 'Sélectionnez une conversation'}</h3>
              <p className="text-muted-foreground">{isSupervision ? 'Surveillez les échanges privés entre membres en temps réel.' : 'Choisissez un canal ou un membre pour discuter.'}</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
