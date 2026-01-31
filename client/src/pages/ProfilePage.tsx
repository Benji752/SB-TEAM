import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User, Save, Globe } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [calendarSrc, setCalendarSrc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.google_calendar_src) {
      setCalendarSrc(user.google_calendar_src);
    }
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à télécharger.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Photo de profil mise à jour",
        description: "Votre nouvelle photo a été enregistrée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCalendar = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ google_calendar_src: calendarSrc })
        .eq('id', user?.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Calendrier mis à jour",
        description: "Votre lien Google Agenda a été enregistré.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-8 px-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 uppercase italic tracking-tighter">Mon <span className="text-gold">Profil</span></h1>
          <p className="text-muted-foreground text-lg">Gérez vos informations personnelles et votre planning.</p>
        </div>

        <Card className="glass-card border-none overflow-hidden bg-white/[0.02]">
          <CardHeader className="bg-white/[0.02] border-b border-white/[0.05] p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-2 border-gold/20 overflow-hidden shadow-2xl">
                  <AvatarImage 
                    src={user?.avatarUrl || user?.avatar_url} 
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="bg-[#0A0A0A] text-gold text-4xl font-black italic">
                    {user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-3 bg-gold text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera size={20} />}
                </Label>
                <Input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{user?.firstName} {user?.lastName}</h2>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="px-4 py-1 bg-gold/10 text-gold text-xs font-black rounded-full border border-gold/20 uppercase tracking-[0.2em]">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Nom d'utilisateur</Label>
                <Input value={user?.username} disabled className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Prénom</Label>
                <Input value={user?.firstName || ""} disabled className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Nom</Label>
                <Input value={user?.lastName || ""} disabled className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl" />
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.05] space-y-6">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Intégration Calendrier</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Lien Google Agenda (Public iframe src)</Label>
                  <Input 
                    value={calendarSrc}
                    onChange={(e) => setCalendarSrc(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/embed?src=..."
                    className="bg-white/[0.03] border-white/[0.1] text-white h-14 rounded-xl focus:border-gold/50 transition-all font-mono text-xs"
                  />
                  <p className="text-[10px] text-white/30 italic ml-1">
                    Note: Collez l'attribut 'src' fourni dans le code d'intégration de votre Google Agenda public.
                  </p>
                </div>

                <Button 
                  onClick={handleSaveCalendar}
                  disabled={saving}
                  className="luxury-button h-14 px-8 rounded-xl flex gap-3 font-black uppercase text-xs tracking-widest"
                >
                  {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save size={18} /> Enregistrer mon agenda</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
