import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Loader2 } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Vous allez être redirigé vers votre tableau de bord.",
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

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_rgba(201,162,77,0.05)_0%,_transparent_70%)]">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gold rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-gold/20 mb-6">
            <LayoutDashboard className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">SB Digital</h1>
          <p className="text-muted-foreground/80 text-lg">Connectez-vous à votre espace luxe.</p>
        </div>

        <Card className="glass-card p-8 border-none">
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
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
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
        </Card>
      </div>
    </div>
  );
}
