import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Save, Globe, Lock, UserPen } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [calendarSrc, setCalendarSrc] = useState("");
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user?.username || "");
      setEmail((user as any)?.email || "");
      setBio((user as any)?.bio || "");
      if ((user as any)?.google_calendar_src) {
        setCalendarSrc((user as any).google_calendar_src);
      }
    }
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez selectionner une image.');
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
        title: "Photo mise a jour",
        description: "Votre nouvelle photo a ete enregistree.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      // Update username and bio via server API
      const res = await fetch("/api/profiles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, bio }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      // Also update username in Supabase profiles directly (for Supabase auth users)
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ username, bio })
          .eq('id', user.id);
      }

      // Update email via Supabase auth if changed
      const currentEmail = (user as any)?.email || "";
      if (email && email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          toast({
            title: "Email",
            description: "Un email de confirmation a ete envoye a la nouvelle adresse. " + (emailError.message || ""),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email",
            description: "Un email de confirmation a ete envoye a votre nouvelle adresse.",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "Profil mis a jour",
        description: "Vos informations ont ete enregistrees.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingPassword(true);

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Mot de passe mis a jour",
        description: "Votre mot de passe a ete change avec succes.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
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
        title: "Calendrier mis a jour",
        description: "Votre lien Google Agenda a ete enregistre.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
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
          <p className="text-muted-foreground text-lg">Gerez vos informations personnelles.</p>
        </div>

        {/* Avatar & Identity Card */}
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
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{user?.username}</h2>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="px-4 py-1 bg-gold/10 text-gold text-xs font-black rounded-full border border-gold/20 uppercase tracking-[0.2em]">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Editable Profile Info */}
          <CardContent className="p-8 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <UserPen className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Informations</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Nom d'utilisateur</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl focus:border-gold/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl focus:border-gold/50 transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Bio</Label>
                  <Input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Decrivez-vous en quelques mots..."
                    className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl focus:border-gold/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Role</Label>
                  <Input value={user?.role || ""} disabled className="bg-white/[0.03] border-white/[0.1] text-white/40 h-12 rounded-xl" />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="luxury-button h-12 px-8 rounded-xl flex gap-3 font-black uppercase text-xs tracking-widest"
              >
                {savingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save size={18} /> Enregistrer</>}
              </Button>
            </div>

            {/* Password Change Section */}
            <div className="pt-8 border-t border-white/[0.05] space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Changer le mot de passe</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caracteres"
                    className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl focus:border-gold/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetez le mot de passe"
                    className="bg-white/[0.03] border-white/[0.1] text-white h-12 rounded-xl focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="luxury-button h-12 px-8 rounded-xl flex gap-3 font-black uppercase text-xs tracking-widest"
              >
                {savingPassword ? <Loader2 className="animate-spin h-5 w-5" /> : <><Lock size={18} /> Changer le mot de passe</>}
              </Button>
            </div>

            {/* Calendar Section */}
            <div className="pt-8 border-t border-white/[0.05] space-y-6">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">Integration Calendrier</h3>
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
                    Collez l'attribut 'src' fourni dans le code d'integration de votre Google Agenda public.
                  </p>
                </div>

                <Button
                  onClick={handleSaveCalendar}
                  disabled={saving}
                  className="luxury-button h-12 px-8 rounded-xl flex gap-3 font-black uppercase text-xs tracking-widest"
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
