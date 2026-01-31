import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Calendar, 
  CheckSquare, 
  HardDrive, 
  FileText, 
  AlertCircle,
  LogOut,
  User,
  History,
  MessageSquare,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseClient";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      // Ignore log errors
      await apiRequest("POST", "/api/auth-logs", { 
        eventType: "LOGOUT", 
        reason: "MANUEL" 
      }).catch(e => console.error("Logging failed", e));
      
      // Force local cleanup
      localStorage.clear();
      
      // Force Supabase cleanup
      await supabase.auth.signOut().catch(() => {});
      
    } catch (e) {
      console.error("Force logout error", e);
    } finally {
      // Nuclear redirection
      window.location.href = '/';
    }
  };

  const menuItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, href: "/" },
    { label: "Commandes", icon: ShoppingCart, href: "/orders" },
    { label: "Ressources", icon: FileText, href: "/resources" },
    { label: "Messages", icon: MessageSquare, href: "/messages" },
    { label: "Calendrier", icon: Calendar, href: "/calendar" },
    { label: "Modèles", icon: Users, href: "/models" },
    { label: "Tâches", icon: CheckSquare, href: "/tasks" },
    { label: "Drive", icon: HardDrive, href: "/drive" },
    { label: "Réclamations", icon: AlertCircle, href: "/complaints" },
  ];

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] flex flex-col fixed inset-y-0 bg-[#050505] z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xl italic">S</span>
            </div>
            <span className="text-xl font-black text-white uppercase tracking-tighter italic">SB <span className="text-gold">Digital</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                location === item.href 
                  ? "bg-gold text-black shadow-[0_0_20px_rgba(201,162,77,0.2)]" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              }`}>
                <item.icon size={20} className={location === item.href ? "text-black" : "group-hover:text-gold"} />
                <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              </a>
            </Link>
          ))}
          
          {isAdmin && (
            <Link href="/logs">
              <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                location === "/logs" 
                  ? "bg-gold text-black shadow-[0_0_20px_rgba(201,162,77,0.2)]" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              }`}>
                <History size={20} className={location === "/logs" ? "text-black" : "group-hover:text-gold"} />
                <span className="text-sm font-bold uppercase tracking-widest">Logs</span>
              </a>
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-white/[0.08] space-y-4 bg-white/[0.01]">
          <Link href="/profile">
            <a className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-[#0A0A0A] text-gold uppercase">
                  {user?.username?.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">{user?.username}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{user?.role}</span>
              </div>
            </a>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 h-11 px-4 rounded-xl font-bold uppercase tracking-widest text-xs"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
