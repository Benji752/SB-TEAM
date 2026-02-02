import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  MessageSquare,
  Users,
  Briefcase,
  Sparkles,
  Trophy,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabaseClient";
import { HeartbeatTracker, useHeartbeatStatus } from "@/components/HeartbeatTracker";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('Sidebar loaded');
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("NUCLEAR LOGOUT INITIATED");
    
    try {
      if (user?.id) {
        const userId = typeof user.id === 'number' ? user.id : parseInt(user.id as string);
        
        // Mark user as offline immediately via API
        try {
          await fetch('/api/user/offline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          // Invalidate presence queries instantly so other users see the change
          queryClient.invalidateQueries({ queryKey: ['/api/user/presence-all'] });
        } catch (e) {
          // Ignore offline API errors
        }
        
        // Enregistrement du LOGOUT
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'LOGOUT',
          details: 'Déconnexion manuelle'
        });
      }

      // 1. Nettoyage brutal
      sessionStorage.removeItem('login_logged');
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Tuer les cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
      }

      // 3. Déconnexion Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Cleanup error:", err);
    }

    // 4. Redirection forcée
    window.location.replace('/');
  };

  const forceLogout = () => {
    console.log("Force Logout clicked");
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    window.location.href = '/';
  };

  const menuItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, href: "/", testId: "link-dashboard" },
    { label: "Hunter League", icon: Trophy, href: "/leaderboard", testId: "link-leaderboard" },
    { label: "IA Studio", icon: Sparkles, href: "/ai-studio", testId: "link-ai-studio" },
    { label: "Projets", icon: Briefcase, href: "/projects", testId: "link-projects" },
    { label: "Commandes", icon: ShoppingCart, href: "/orders", testId: "link-orders" },
    { label: "Ressources", icon: FileText, href: "/resources", testId: "link-resources" },
    { label: "Messages", icon: MessageSquare, href: "/messages", testId: "link-messages" },
    { label: "Calendrier", icon: Calendar, href: "/calendar", testId: "link-calendar" },
    { label: "Équipe", icon: Users, href: "/models", testId: "link-models" },
    { label: "Tâches", icon: CheckSquare, href: "/tasks", testId: "link-tasks" },
    { label: "Drive", icon: HardDrive, href: "/drive", testId: "link-drive" },
    { label: "Réclamations", icon: AlertCircle, href: "/complaints", testId: "link-complaints" },
  ];

  const isAdmin = user?.role === "admin" || user?.role?.toLowerCase() === "admin";
  const isActive = useHeartbeatStatus();
  console.log('User Role:', user?.role);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505]">
      <HeartbeatTracker />
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505] border-b border-white/[0.08] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-xl italic">S</span>
          </div>
          <span className="text-lg font-black text-white uppercase tracking-tighter italic">SB <span className="text-gold">Digital</span></span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/80 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-16 left-0 bottom-0 w-72 bg-[#050505] border-r border-white/[0.08] z-50 overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div 
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-${item.testId}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${
                      location === item.href 
                        ? "bg-gold text-black shadow-[0_0_20px_rgba(201,162,77,0.2)]" 
                        : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                    }`}>
                      <item.icon size={20} className={location === item.href ? "text-black" : "group-hover:text-gold"} />
                      <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                    </div>
                  </Link>
                ))}
                
                {isAdmin && (
                  <Link href="/logs">
                    <div 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${
                      location === "/logs" 
                        ? "bg-gold text-black" 
                        : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                    }`}>
                      <Clock size={20} className={location === "/logs" ? "text-black" : "group-hover:text-gold"} />
                      <span className="text-sm font-bold uppercase tracking-widest">Logs</span>
                    </div>
                  </Link>
                )}
              </nav>
              
              <div className="p-4 border-t border-white/[0.08] mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={user?.avatarUrl || user?.avatar_url} />
                    <AvatarFallback className="bg-[#0A0A0A] text-gold uppercase">
                      {user?.username?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-bold text-white block">{user?.username}</span>
                    <span className="text-[10px] text-gold font-black uppercase tracking-widest">{user?.role}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={(e) => { handleLogout(e); setMobileMenuOpen(false); }}
                >
                  <LogOut size={18} />
                  Déconnexion
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/[0.08] flex-col fixed inset-y-0 bg-[#050505] z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xl italic">S</span>
            </div>
            <span className="text-xl font-black text-white uppercase tracking-tighter italic">SB <span className="text-gold">Digital</span></span>
          </div>
          
          {user && (
            <div className={`mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isActive 
                ? "bg-green-500/10 border border-green-500/20" 
                : "bg-yellow-500/10 border border-yellow-500/20"
            }`}>
              <motion.div
                animate={{ opacity: isActive ? [1, 0.4, 1] : 0.5 }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
                className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <span className={`text-xs font-medium ${isActive ? "text-green-400" : "text-yellow-400"}`}>
                {isActive ? "En ligne (+XP actifs)" : "Inactif"}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                data-testid={item.testId}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${
                location === item.href 
                  ? "bg-gold text-black shadow-[0_0_20px_rgba(201,162,77,0.2)]" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              }`}>
                <item.icon size={20} className={location === item.href ? "text-black" : "group-hover:text-gold"} />
                <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              </div>
            </Link>
          ))}
          
          {isAdmin && (
            <Link href="/logs">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group cursor-pointer ${
                location === "/logs" 
                  ? "bg-gold text-black shadow-[0_0_20_rgba(201,162,77,0.2)]" 
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              }`}>
                <Clock size={20} className={location === "/logs" ? "text-black" : "group-hover:text-gold"} />
                <span className="text-sm font-bold uppercase tracking-widest">Logs</span>
              </div>
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-white/[0.08] space-y-4 bg-white/[0.01]">
          <div className="px-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 overflow-hidden">
                  <AvatarImage 
                    src={user?.avatarUrl || user?.avatar_url} 
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="bg-[#0A0A0A] text-gold uppercase">
                    {user?.username?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-[#050505] rounded-full shadow-lg" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">{user?.username}</span>
                <span className="text-[10px] text-gold font-black uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>
          </div>
          
          <Link href="/profile">
            <div className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group cursor-pointer ${
              location === "/profile" ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
            }`}>
              <div className="h-10 w-10 flex items-center justify-center text-white/40 group-hover:text-white">
                <User size={20} />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-widest">Profil</span>
            </div>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 h-11 px-4 rounded-xl font-bold uppercase tracking-widest text-xs z-[9999]"
            onClick={(e) => handleLogout(e)}
          >
            <LogOut size={18} />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 min-h-screen pt-16 md:pt-0">
        <div className="max-w-[1600px] mx-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
