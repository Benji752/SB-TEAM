import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Send, Loader2, CheckCheck } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";

export default function Messages() {
  const { user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    contacts, 
    chatMessages, 
    isLoadingContacts, 
    isLoadingMessages, 
    sendMessage,
    markAsRead 
  } = useMessages(selectedContactId || undefined);

  useEffect(() => {
    if (selectedContactId && chatMessages) {
      markAsRead.mutate();
    }
  }, [selectedContactId, chatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContactId) return;
    sendMessage.mutate(messageText);
    setMessageText("");
  };

  const selectedContact = contacts?.find((c: any) => c.id === selectedContactId);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6">
        {/* Chat List */}
        <Card className="w-96 flex flex-col glass-card border-none rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/[0.05] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-gold hover:bg-white/[0.05] rounded-xl"><Plus size={24} /></Button>
          </div>
          <div className="p-6 border-b border-white/[0.05]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input className="pl-12 bg-black/40 border-white/[0.08] text-white h-12 rounded-xl" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingContacts ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
            ) : contacts?.map((contact: any) => (
              <div 
                key={contact.id} 
                onClick={() => setSelectedContactId(contact.id)}
                className={`p-6 flex items-center gap-5 cursor-pointer transition-all border-b border-white/[0.03] last:border-0 ${selectedContactId === contact.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}
              >
                <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
                  <AvatarImage src={contact.avatar_url || ""} />
                  <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">{contact.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-base text-white">{contact.username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground/60 truncate font-medium">Cliquer pour discuter</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        {selectedContactId ? (
          <Card className="flex-1 flex flex-col glass-card border-none rounded-3xl overflow-hidden bg-white/[0.02]">
            <div className="p-8 border-b border-white/[0.05] flex items-center gap-5 backdrop-blur-md">
              <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
                <AvatarImage src={selectedContact?.avatar_url || ""} />
                <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">{selectedContact?.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg text-white">{selectedContact?.username}</h3>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest">En ligne</p>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto">
              {isLoadingMessages ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-gold" /></div>
              ) : chatMessages?.map((msg: any) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[70%] px-6 py-4 rounded-[24px] text-sm font-semibold shadow-2xl ${
                    msg.sender_id === user?.id 
                      ? 'self-end bg-gold text-black rounded-tr-none shadow-gold/10' 
                      : 'self-start bg-white/[0.03] text-white/90 rounded-tl-none border border-white/[0.05]'
                  }`}
                >
                  {msg.content}
                  {msg.sender_id === user?.id && (
                    <div className="flex justify-end mt-1 opacity-50">
                      {msg.isRead ? <CheckCheck size={14} className="text-black" /> : <div className="text-[10px]">Envoyé</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-8 border-t border-white/[0.05] flex gap-4 backdrop-blur-md">
              <Input 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tapez votre message..." 
                className="flex-1 bg-black/40 border-white/[0.08] text-white h-14 rounded-2xl px-6" 
              />
              <Button type="submit" size="icon" className="luxury-button h-14 w-14"><Send size={24} /></Button>
            </form>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center glass-card border-none rounded-3xl bg-white/[0.02]">
            <div className="text-center">
              <div className="h-20 w-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05]">
                <Plus size={32} className="text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sélectionnez une conversation</h3>
              <p className="text-muted-foreground">Choisissez un modèle pour démarrer la discussion.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
