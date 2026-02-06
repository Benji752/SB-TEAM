import { useState } from "react";
import { LayoutDashboard, Loader2, Shield, Camera, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const TEAM_USERS = [
  {
    id: 1,
    username: "Benjamin",
    role: "admin",
    email: "admin@sb-digital.fr",
    icon: Shield,
    gradient: "from-amber-500/20 to-yellow-600/20",
    border: "border-amber-500/30 hover:border-amber-400/60",
    badge: "bg-amber-500/20 text-amber-400",
    description: "Administrateur"
  },
  {
    id: 2,
    username: "Laura",
    role: "model",
    email: "laura@sb-digital.fr",
    icon: Camera,
    gradient: "from-pink-500/20 to-rose-600/20",
    border: "border-pink-500/30 hover:border-pink-400/60",
    badge: "bg-pink-500/20 text-pink-400",
    description: "Model"
  },
  {
    id: 3,
    username: "Nico",
    role: "staff",
    email: "nico@sb-digital.fr",
    icon: Wrench,
    gradient: "from-purple-500/20 to-violet-600/20",
    border: "border-purple-500/30 hover:border-purple-400/60",
    badge: "bg-purple-500/20 text-purple-400",
    description: "Staff"
  }
];

export default function Landing() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<number | null>(null);

  const handleSelectUser = async (userId: number) => {
    setLoading(userId);
    try {
      const response = await fetch("/api/login-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Login failed");

      const user = await response.json();

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.username} !`,
      });

      // Invalidate cache and reload
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_rgba(201,162,77,0.05)_0%,_transparent_70%)]">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gold rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-gold/20 mb-6">
            <LayoutDashboard className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">SB Digital</h1>
          <p className="text-muted-foreground/80 text-lg">
            Sélectionnez votre profil pour continuer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEAM_USERS.map((user) => {
            const Icon = user.icon;
            const isLoading = loading === user.id;
            return (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                disabled={loading !== null}
                className={`
                  relative group p-6 rounded-2xl border transition-all duration-300
                  bg-gradient-to-b ${user.gradient} ${user.border}
                  hover:scale-[1.02] hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-center space-y-4
                `}
              >
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto group-hover:bg-white/10 transition-colors">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                  ) : (
                    <Icon className="h-8 w-8 text-white/80" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{user.username}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${user.badge}`}>
                    {user.description}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">{user.email}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
