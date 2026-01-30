import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, ShieldCheck, Users, UserCircle, Zap } from "lucide-react";

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 rotate-3">
            <LayoutDashboard className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">AgencyFlow Demo</h1>
          <p className="text-muted-foreground text-lg">Choisissez votre rôle pour explorer l'interface</p>
        </div>

        <div className="grid gap-4">
          <Button 
            size="lg" 
            className="h-20 text-xl shadow-xl shadow-primary/10 group relative overflow-hidden"
            onClick={() => login("admin")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-4">
              <ShieldCheck className="h-8 w-8" />
              <span>Entrer comme Admin</span>
            </div>
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            className="h-20 text-xl border-2 hover:bg-primary/5 group"
            onClick={() => login("staff")}
          >
            <div className="flex items-center justify-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <span>Entrer comme Staff</span>
            </div>
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            className="h-20 text-xl border-2 hover:bg-primary/5 group"
            onClick={() => login("model")}
          >
            <div className="flex items-center justify-center gap-4">
              <UserCircle className="h-8 w-8 text-primary" />
              <span>Entrer comme Modèle</span>
            </div>
          </Button>
        </div>

        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
            <Zap size={14} className="fill-primary" /> Accès Instantané
          </div>
        </div>
      </div>
    </div>
  );
}
