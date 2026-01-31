import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Messages() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('username', { ascending: true });
        
        if (error) {
          console.error("Error fetching profiles:", error);
          return;
        }
        
        setProfiles(data || []);
      } catch (err) {
        console.error("Unexpected error fetching profiles:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6">
        {/* Chat List */}
        <Card className="w-96 flex flex-col glass-card border-none rounded-3xl overflow-hidden bg-white/[0.02]">
          <div className="p-8 border-b border-white/[0.05]">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-gold" />
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              profiles.map((profile) => {
                if (!profile?.id) return null;
                return (
                  <div 
                    key={profile.id} 
                    onClick={() => setSelectedUser(profile)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all rounded-2xl border border-transparent ${
                      selectedUser?.id === profile.id ? 'bg-white/[0.1] border-white/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <Avatar className="h-12 w-12 border border-white/10">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="bg-white/[0.05] text-gold font-bold">
                        {profile.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{profile.username}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{profile.role}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex items-center justify-center glass-card border-none rounded-3xl bg-white/[0.02]">
          {selectedUser ? (
            <div className="text-center p-8">
              <Avatar className="h-24 w-24 border-2 border-gold/20 mx-auto mb-6">
                <AvatarImage src={selectedUser.avatar_url || ""} />
                <AvatarFallback className="bg-white/[0.05] text-gold text-2xl font-bold">
                  {selectedUser.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedUser.username}</h3>
              <p className="text-muted-foreground mb-8 capitalize">{selectedUser.role}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest border border-gold/20">
                <MessageSquare size={14} /> Messagerie Simplifiée (Lecture Seule)
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="h-20 w-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05] text-gold">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sélectionnez une conversation</h3>
              <p className="text-muted-foreground">Choisissez un membre pour voir son profil.</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
