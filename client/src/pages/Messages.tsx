import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Plus } from "lucide-react";

const mockChats = [
  { id: 1, name: "Alice V.", lastMsg: "J'ai fini le shoot !", time: "10:30", unread: 2 },
  { id: 2, name: "Bella M.", lastMsg: "Tu as reçu le drive ?", time: "09:15", unread: 0 },
  { id: 3, name: "Manager Team", lastMsg: "Brief pour demain dispo", time: "Hier", unread: 0 },
];

export default function Messages() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Chat List */}
        <Card className="w-96 flex flex-col glass-card border-none rounded-none rounded-l-3xl overflow-hidden">
          <div className="p-8 border-b border-white/[0.05] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-gold hover:bg-white/[0.05] rounded-xl"><Plus size={24} /></Button>
          </div>
          <div className="p-8 border-b border-white/[0.05]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input className="pl-12 bg-black/40 border-white/[0.08] text-white h-12 rounded-xl" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div key={chat.id} className="p-8 flex items-center gap-5 hover:bg-white/[0.02] cursor-pointer transition-all border-b border-white/[0.03] last:border-0">
                <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
                  <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-base text-white">{chat.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground/60 truncate font-medium">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-6 w-6 bg-gold rounded-full flex items-center justify-center text-[10px] text-black font-black shadow-lg shadow-gold/20">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col glass-card border-none rounded-none rounded-r-3xl overflow-hidden bg-white/[0.02]">
          <div className="p-8 border-b border-white/[0.05] flex items-center gap-5 backdrop-blur-md">
            <Avatar className="h-14 w-14 border-2 border-white/[0.05]">
              <AvatarFallback className="bg-white/[0.03] text-gold font-bold text-lg">AV</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg text-white">Alice V.</h3>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest">En ligne</p>
            </div>
          </div>
          <div className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto">
            <div className="self-end bg-gold text-black px-6 py-4 rounded-[24px] rounded-tr-none max-w-[70%] text-sm font-semibold shadow-2xl shadow-gold/10">
              Salut Alice, comment s'est passé le shooting ?
            </div>
            <div className="self-start bg-white/[0.03] text-white/90 px-6 py-4 rounded-[24px] rounded-tl-none max-w-[70%] text-sm font-semibold border border-white/[0.05]">
              Génial ! Les photos sont magnifiques. Je te les envoie sur le Drive.
            </div>
            <div className="self-end bg-gold text-black px-6 py-4 rounded-[24px] rounded-tr-none max-w-[70%] text-sm font-semibold shadow-2xl shadow-gold/10">
              Top ! Je regarde ça tout de suite.
            </div>
          </div>
          <div className="p-8 border-t border-white/[0.05] flex gap-4 backdrop-blur-md">
            <Input placeholder="Tapez votre message..." className="flex-1 bg-black/40 border-white/[0.08] text-white h-14 rounded-2xl px-6" />
            <Button size="icon" className="luxury-button h-14 w-14"><Send size={24} /></Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
