import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (type === "recovery" && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get("refresh_token") || "",
      });
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
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

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      setSuccess(true);
      toast({ 
        title: "Mot de passe mis à jour", 
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." 
      });
      
      setTimeout(() => {
        window.location.href = "/landing";
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      toast({ 
        title: "Erreur", 
        description: err.message || "Impossible de réinitialiser le mot de passe.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground/80 text-lg">Réinitialisez votre mot de passe</p>
        </div>

        <Card className="glass-card p-8 border-none">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Mot de passe réinitialisé</h2>
              <p className="text-muted-foreground">
                Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              <Button 
                onClick={() => window.location.href = "/landing"} 
                className="w-full luxury-button h-12"
                data-testid="button-go-login"
              >
                Aller à la connexion
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h2>
                <p className="text-sm text-muted-foreground">Entrez votre nouveau mot de passe (minimum 6 caractères).</p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input 
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      className="bg-white/[0.03] border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/30 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-new-password"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="bg-white/[0.03] border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/30 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full luxury-button h-12" 
                  disabled={loading}
                  data-testid="button-reset-password"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
