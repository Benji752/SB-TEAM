import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAllUsersPresence } from "@/hooks/useUserPresence";

export default function Messages() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { getPresence } = useAllUsersPresence();

  useEffect(() => {
    async function init() {
      try {
        setIsLoadingProfiles(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        await fetchProfiles(user?.id);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoadingProfiles(false);
      }
    }
    init();

    // Auto-refresh profiles every 10 seconds
    const interval = setInterval(() => {
      if (currentUser) {
        fetchProfiles(currentUser.id);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  async function fetchProfiles(currentUserId: string | undefined) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true });
      
      if (error) throw error;
      
      const filtered = (data || []).filter(p => p.id !== currentUserId);
      setProfiles(filtered);

      // Refresh selected user data if active
      if (selectedUser) {
        const updatedSelected = data?.find(p => p.id === selectedUser.id);
        if (updatedSelected) setSelectedUser(updatedSelected);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  }

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    // Vérification radicale de la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Session expirée. Veuillez vous reconnecter.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: messageText.trim(),
          is_read: false
        });

      if (error) {
        if (error.message?.includes("Auth session missing")) {
          window.location.replace('/');
          return;
        }
        throw error;
      }
      
      setMessageText("");
      await fetchMessages(selectedUser.id);
    } catch (err: any) {
      console.error("Error sending message:", err);
      if (err.message?.includes("Auth session missing")) {
        window.location.replace('/');
        return;
      }
      alert("Erreur lors de l'envoi");
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6">
        <Card className="w-96 flex flex-col glass-card border-none rounded-3xl overflow-hidden bg-white/[0.02]">
          <div className="p-8 border-b border-white/[0.05]">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoadingProfiles ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-gold" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Aucun membre trouvé</div>
            ) : (
              profiles.map((profile) => (
                <div 
                  key={profile.id} 
                  onClick={() => setSelectedUser(profile)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all rounded-2xl border border-transparent ${
                    selectedUser?.id === profile.id ? 'bg-gold/10 border-gold/20' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative z-0">
                    <Avatar className="h-12 w-12 border border-white/10 overflow-hidden">
                      <AvatarImage 
                        src={profile.avatar_url || profile.avatarUrl || ""} 
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="bg-white/[0.05] text-gold font-bold">
                        {profile.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#050505] rounded-full shadow-lg z-10 ${
                        getPresence(profile.id).isOnline ? 'bg-[#10B981]' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{profile.username}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{profile.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex-1 flex flex-col glass-card border-none rounded-3xl overflow-hidden bg-white/[0.02]">
          {selectedUser ? (
            <>
              <div className="p-6 border-b border-white/[0.05] flex items-center gap-4 bg-white/[0.01]">
                <div className="relative z-0">
                  <Avatar className="h-10 w-10 border border-white/10 overflow-hidden">
                    <AvatarImage 
                      src={selectedUser.avatar_url || selectedUser.avatarUrl || ""} 
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="bg-white/[0.05] text-gold font-bold">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#050505] rounded-full shadow-lg z-10 ${
                      getPresence(selectedUser.id).isOnline ? 'bg-[#10B981]' : 'bg-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedUser.username}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getPresence(selectedUser.id).isOnline ? 'bg-[#10B981]' : 'bg-gray-500'}`} />
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${getPresence(selectedUser.id).isOnline ? 'text-[#10B981]' : 'text-gray-500'}`}>
                      {getPresence(selectedUser.id).isOnline ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 custom-scrollbar">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 italic">
                    <MessageSquare size={48} className="mb-4" />
                    <p>Aucun message. Commencez la discussion !</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                        msg.sender_id === currentUser?.id 
                          ? 'self-end bg-gold text-black rounded-tr-none shadow-[0_5px_15px_rgba(201,162,77,0.1)]' 
                          : 'self-start bg-white/[0.05] text-white rounded-tl-none border border-white/[0.08]'
                      }`}
                    >
                      <div className="font-medium break-words">{msg.content}</div>
                      <div className={`text-[9px] mt-1 opacity-50 text-right ${msg.sender_id === currentUser?.id ? 'text-black/70' : 'text-white/50'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSend} className="p-6 border-t border-white/[0.05] flex gap-3 bg-white/[0.01]">
                <Input 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Écrivez votre message..." 
                  className="flex-1 bg-black/40 border-white/[0.1] text-white h-12 rounded-xl px-4 focus:border-gold/50"
                />
                <Button 
                  type="submit" 
                  disabled={!messageText.trim() || isLoadingMessages}
                  className="luxury-button h-12 px-6 rounded-xl flex gap-2 font-bold uppercase text-[10px] tracking-widest"
                >
                  Envoyer
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="h-20 w-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05] text-gold">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sélectionnez une conversation</h3>
                <p className="text-muted-foreground">Choisissez un membre pour commencer à discuter.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
