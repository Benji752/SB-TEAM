import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { LayoutDashboard, Loader2, ArrowLeft } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // After Supabase login, fetch profile to get user_id and set cookie for server
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', data.user.id)
          .single();

        if (profile?.user_id) {
          // Set cookie so Express API knows who we are
          await fetch("/api/login-demo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: profile.user_id }),
            credentials: "include",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre tableau de bord.",
      });

      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse email.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'email de réinitialisation.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_rgba(201,162,77,0.05)_0%,_transparent_70%)]">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gold rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-gold/20 mb-6">
            <LayoutDashboard className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">SB Digital</h1>
          <p className="text-muted-foreground/80 text-lg">
            {showForgotPassword ? "Réinitialisez votre mot de passe." : "Connectez-vous à votre espace luxe."}
          </p>
        </div>

        <Card className="glass-card p-8 border-none">
          {showForgotPassword ? (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Retour à la connexion</span>
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h2>
                <p className="text-sm text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="bg-white/[0.03] border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/30"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full luxury-button h-12" disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Envoyer le lien"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Connexion</h2>
                <p className="text-sm text-muted-foreground">Entrez vos identifiants pour continuer.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@agency.com"
                    className="bg-white/[0.03] border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-gold hover:text-gold/80 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    className="bg-white/[0.03] border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full luxury-button h-12" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accéder au Dashboard"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
