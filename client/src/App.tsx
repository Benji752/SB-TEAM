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
import Landing from "@/pages/Landing";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function InactivityHandler() {
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

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
    if (!user) return;

    let timeout: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          await apiRequest("POST", "/api/auth-logs", { 
            eventType: "LOGOUT", 
            reason: "AUTO_TIMEOUT" 
          });
        } catch (e) {
          console.error("Failed to log auto-logout", e);
        } finally {
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/";
        }
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [user]);

  return null;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérification initiale de la session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          await supabase.from('profiles').update({ is_online: true }).eq('id', session.user.id);
        }
      } catch (err) {
        console.error("Session init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        await supabase.from('profiles').update({ is_online: true }).eq('id', session.user.id);
      }
    });

    const handleUnload = () => {
      if (session?.user) {
        const { id } = session.user;
        // Use navigator.sendBeacon or a synchronous fetch if possible, 
        // but for Supabase we'll try a quick update. 
        // Note: beforeunload is tricky for async.
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
              <Route component={NotFound} />
            </Switch>
          </>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
