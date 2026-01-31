import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

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
        .eq('id', user.id);

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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-8 px-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Mon Profil</h1>
          <p className="text-muted-foreground text-lg">Gérez vos informations personnelles et votre photo.</p>
        </div>

        <Card className="glass-card border-none overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/[0.05] p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-2 border-gold/20 overflow-hidden">
                  <AvatarImage 
                    src={user?.avatarUrl || user?.avatar_url} 
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="bg-[#0A0A0A] text-gold text-4xl">
                    <User size={48} />
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-2 bg-gold text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg"
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
                <h2 className="text-2xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-bold rounded-full border border-gold/20 uppercase tracking-widest">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/60">Nom d'utilisateur</Label>
                <Input value={user?.username} disabled className="bg-white/[0.03] border-white/[0.1] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Prénom</Label>
                <Input value={user?.firstName || ""} disabled className="bg-white/[0.03] border-white/[0.1] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Nom</Label>
                <Input value={user?.lastName || ""} disabled className="bg-white/[0.03] border-white/[0.1] text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
