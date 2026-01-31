import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Calendar as CalendarIcon, Mail, X } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  role: string;
  avatar_url: string;
  google_calendar_src: string | null;
  email?: string;
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('role', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error("Error fetching team:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase();
    if (r === 'admin') return <Badge className="bg-gold text-black border-gold/50 font-black uppercase tracking-widest text-[10px] px-3">Admin</Badge>;
    if (r === 'staff') return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black uppercase tracking-widest text-[10px] px-3">Staff</Badge>;
    return <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 font-black uppercase tracking-widest text-[10px] px-3">Model</Badge>;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">SB <span className="text-gold">Équipe</span></h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Gestion des talents et collaborateurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <Card 
            key={profile.id}
            onClick={() => setSelectedUser(profile)}
            className="group bg-[#0A0A0A] border-white/[0.05] hover:border-gold/30 rounded-3xl p-6 transition-all cursor-pointer hover-elevate active-elevate-2 flex flex-col items-center text-center space-y-4"
          >
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-white/5 group-hover:border-gold/30 transition-colors shadow-2xl">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-white/5 text-gold text-2xl font-black italic">
                  {profile.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#10B981] border-4 border-[#0A0A0A] rounded-full shadow-lg" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{profile.username}</h3>
              {getRoleBadge(profile.role)}
            </div>

            <div className="w-full pt-4 border-t border-white/[0.05] flex justify-center">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-widest group-hover:text-gold transition-colors">Voir le planning →</span>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-4xl bg-[#050505] border-white/[0.08] text-white p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)]">
          <div className="relative h-full flex flex-col">
            <div className="p-10 bg-white/[0.02] border-b border-white/[0.05] flex flex-col md:flex-row items-center gap-8">
              <Avatar className="h-32 w-32 border-4 border-white/5 shadow-2xl">
                <AvatarImage src={selectedUser?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-3xl font-black italic text-gold">
                  {selectedUser?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{selectedUser?.username}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {getRoleBadge(selectedUser?.role || '')}
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                      <Mail className="h-3 w-3 text-gold" />
                      <span>{selectedUser?.username.toLowerCase()}@sb.digital</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-10 space-y-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Planning de la semaine</h3>
              </div>

              <div className="aspect-video w-full bg-black rounded-[2rem] border border-white/5 overflow-hidden relative shadow-inner">
                {selectedUser?.google_calendar_src ? (
                  <iframe 
                    src={selectedUser.google_calendar_src}
                    style={{ border: 0 }}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    className="opacity-90 grayscale-[30%] invert-[5%] contrast-[110%]"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center space-y-4 text-white/20">
                    <CalendarIcon className="h-16 w-16 opacity-5" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Aucun planning partagé</span>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 rounded-[2rem]" />
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-all border border-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
