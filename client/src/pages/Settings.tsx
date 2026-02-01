import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema, type Profile } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type InsertProfile = z.infer<typeof insertProfileSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema.partial()),
    defaultValues: {
      username: "",
      bio: "",
      role: "model"
    }
  });

  useEffect(() => {
    if (profile) {
      form.reset(profile);
    }
  }, [profile, form]);

  const onSubmit = async (data: Partial<InsertProfile>) => {
    try {
      await updateMutation.mutateAsync(data);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  // Handle email change
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast({ title: "Erreur", description: "Veuillez entrer un nouvel email.", variant: "destructive" });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      toast({ 
        title: "Email mis à jour", 
        description: "Un email de confirmation a été envoyé à votre nouvelle adresse." 
      });
      setNewEmail("");
    } catch (error: any) {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de mettre à jour l'email.", 
        variant: "destructive" 
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ 
        title: "Mot de passe mis à jour", 
        description: "Votre mot de passe a été changé avec succès." 
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de mettre à jour le mot de passe.", 
        variant: "destructive" 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Info</CardTitle>
              <CardDescription>Your public profile information.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.profileImageUrl || ""} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase">
                {profile?.role || "User"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modifier le Profil</CardTitle>
              <CardDescription>Mettez à jour votre nom d'utilisateur et bio.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom d'utilisateur</Label>
                  <Input {...form.register("username")} placeholder="username" data-testid="input-username" />
                  {form.formState.errors.username && <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea {...form.register("bio")} placeholder="Parlez-nous de vous..." className="min-h-[120px]" data-testid="input-bio" />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-profile">
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Changer l'Email
              </CardTitle>
              <CardDescription>Mettez à jour votre adresse email. Un email de confirmation sera envoyé.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email actuel</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Nouvel email</Label>
                  <Input 
                    type="email" 
                    placeholder="nouveau@email.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    data-testid="input-new-email"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={emailLoading} data-testid="button-change-email">
                    {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Changer l'email
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Changer le Mot de Passe
              </CardTitle>
              <CardDescription>Mettez à jour votre mot de passe. Minimum 6 caractères.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nouveau mot de passe" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={passwordLoading} data-testid="button-change-password">
                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
