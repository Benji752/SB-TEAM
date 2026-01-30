import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Users, MessageSquare, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Landing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mockLoginMutation = useMutation({
    mutationFn: async (role: "admin" | "staff" | "model") => {
      // First ensure user is logged in via Replit Auth
      if (!user) {
        window.location.href = "/api/login";
        return;
      }
      const res = await fetch("/api/auth/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      window.location.href = "/";
    }
  });

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">AgencyFlow</span>
        </div>
        <div className="flex gap-4">
          {user ? (
            <Button asChild>
              <a href="/">Tableau de bord</a>
            </Button>
          ) : (
            <Button asChild className="shadow-lg shadow-primary/20">
              <a href="/api/login">Se connecter</a>
            </Button>
          )}
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Zap size={14} /> La plateforme n°1 pour les agences
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Gérez votre agence avec <span className="text-primary">précision</span>
          </h1>
          <p className="text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            De la gestion des prospects au suivi des revenus, centralisez toute votre activité en un seul endroit sécurisé.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 group" asChild>
              <a href="/api/login">
                Démarrer maintenant <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            
            {user && (
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 px-8 text-base glass"
                onClick={() => mockLoginMutation.mutate("admin")}
                disabled={mockLoginMutation.isPending}
              >
                Tester en tant qu'Admin
              </Button>
            )}
          </div>
        </div>

        {/* Mock UI Preview */}
        <div className="relative mt-20 animate-in fade-in zoom-in duration-1000 delay-700">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden aspect-video relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
            <div className="p-8 flex gap-6 h-full">
              <div className="w-48 space-y-4 border-r pr-6 hidden md:block">
                {[Users, MessageSquare, LayoutDashboard].map((Icon, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse flex items-center px-2">
                    <Icon size={14} className="text-muted-foreground mr-2" />
                  </div>
                ))}
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex-1 h-24 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
                <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { title: "Gestion des Rôles", desc: "Admin, Staff et Modèles avec accès granulaires.", icon: ShieldCheck },
            { title: "Suivi des Revenus", desc: "Tableaux de bord analytiques complets.", icon: LayoutDashboard },
            { title: "Drive Sécurisé", desc: "Documents et médias centralisés.", icon: CheckCircle2 },
          ].map((feature, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-primary/10 hover-card-effect">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
