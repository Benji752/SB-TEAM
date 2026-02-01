import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import CalendarPage from "@/pages/CalendarPage";
import Tasks from "@/pages/Tasks";
import Drive from "@/pages/Drive";
import ResourcesPage from "@/pages/ResourcesPage";
import ComplaintsPage from "@/pages/ComplaintsPage";
import ProfilePage from "@/pages/ProfilePage";
import LogsPage from "@/pages/LogsPage";
import Messages from "@/pages/Messages";
import Models from "@/pages/Models";
import Projects from "@/pages/Projects";
import Landing from "@/pages/Landing";
import AITools from "@/pages/AITools";
import Leaderboard from "@/pages/Leaderboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function InactivityHandler() {
  const [user, setUser] = useState<any>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || showTimeoutModal) return;

    let timeout: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes pour la prod

    const triggerTimeout = () => {
      setShowTimeoutModal(true);
    };

    const resetTimer = () => {
      if (!showTimeoutModal) {
        clearTimeout(timeout);
        timeout = setTimeout(triggerTimeout, INACTIVITY_LIMIT);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [user, showTimeoutModal]);

  const handleFinalLogout = async () => {
    try {
      if (user) {
        // 1. Log l'activité
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'LOGOUT',
          details: 'Déconnexion automatique (inactivité)'
        });

        // 2. Mettre is_online à false
        await supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
      }

      // 3. Nettoyer session et déconnecter
      sessionStorage.removeItem('login_logged');
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
      
      window.location.replace('/');
    } catch (err) {
      console.error("Auto logout error:", err);
      window.location.replace('/');
    }
  };

  if (showTimeoutModal) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-20 w-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-gold/20">
            <Loader2 className="h-10 w-10 text-gold" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Session Expirée</h2>
            <p className="text-muted-foreground text-sm">Par mesure de sécurité, vous avez été déconnecté après une période d'inactivité.</p>
          </div>
          <button 
            onClick={handleFinalLogout}
            className="w-full h-12 bg-gold hover:bg-gold/90 text-black font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(201,162,77,0.3)]"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  return null;
}

import { OnboardingTutorial } from "./components/OnboardingTutorial";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérification initiale de la session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false); // Affiche le site immédiatement

        if (session?.user) {
          // Mise à jour du statut en arrière-plan sans bloquer
          supabase.from('profiles')
            .update({ is_online: true })
            .eq('id', session.user.id)
            .then(({ error }) => {
              if (error) console.error("Error setting online status:", error);
            });
            
          // Enregistrement du LOGIN (avec protection contre les doublons)
          if (!sessionStorage.getItem('login_logged')) {
            sessionStorage.setItem('login_logged', 'true');
            supabase.from('activity_logs').insert({
              user_id: session.user.id,
              action: 'LOGIN',
              details: 'Connexion réussie'
            }).then(({ error }) => {
              if (error) {
                console.error("Error logging login:", error);
                sessionStorage.removeItem('login_logged'); // Réessayer au prochain check si erreur
              }
            });
          }
        }
      } catch (err) {
        console.error("Session init error:", err);
        setLoading(false);
      }
    };

    initSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        supabase.from('profiles')
          .update({ is_online: true })
          .eq('id', session.user.id)
          .then(({ error }) => {
            if (error) console.error("Error updating online status:", error);
          });
      }
    });

    const handleUnload = () => {
      if (session?.user) {
        const { id } = session.user;
        // Utilisation de navigator.sendBeacon pour assurer l'envoi lors de la fermeture
        // Note: Supabase direct via SDK is harder in unload, so we use a beacon with a custom endpoint if needed
        // For now, we'll try a synchronous update attempt if possible, or just the standard SDK update
        supabase.from('profiles').update({ is_online: false }).eq('id', id);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto" />
          <p className="text-white/50 font-bold uppercase tracking-widest text-xs">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!session ? (
          <Landing />
        ) : (
          <>
            <OnboardingTutorial />
            <InactivityHandler />
            <Switch>
              <Route path="/">
                <Dashboard />
              </Route>
              <Route path="/orders">
                <Orders />
              </Route>
              <Route path="/calendar">
                <CalendarPage />
              </Route>
              <Route path="/tasks">
                <Tasks />
              </Route>
              <Route path="/drive">
                <Drive />
              </Route>
              <Route path="/resources">
                <ResourcesPage />
              </Route>
              <Route path="/complaints">
                <ComplaintsPage />
              </Route>
              <Route path="/projects">
                <Projects />
              </Route>
              <Route path="/ai-studio">
                <AITools />
              </Route>
              <Route path="/profile">
                <ProfilePage />
              </Route>
              <Route path="/messages">
                <Messages />
              </Route>
              <Route path="/models">
                <Models />
              </Route>
              <Route path="/logs">
                <LogsPage />
              </Route>
              <Route path="/leaderboard">
                <Leaderboard />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
