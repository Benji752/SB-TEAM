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
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold">Messages</h2>
            <Button size="icon" variant="ghost"><Plus size={18} /></Button>
          </div>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div key={chat.id} className="p-4 flex items-center gap-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-0">
                <Avatar>
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm">{chat.name}</span>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar>
              <AvatarFallback>AV</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">Alice V.</h3>
              <p className="text-[10px] text-green-500">En ligne</p>
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="self-end bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[70%] text-sm">
              Salut Alice, comment s'est passé le shooting ?
            </div>
            <div className="self-start bg-muted p-3 rounded-2xl rounded-tl-none max-w-[70%] text-sm">
              Génial ! Les photos sont magnifiques. Je te les envoie sur le Drive.
            </div>
            <div className="self-end bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[70%] text-sm">
              Top ! Je regarde ça tout de suite.
            </div>
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input placeholder="Votre message..." className="flex-1" />
            <Button size="icon"><Send size={18} /></Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
