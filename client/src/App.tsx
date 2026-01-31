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
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { Loader2 } from "lucide-react";

function InactivityHandler() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

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
        }
        await logout();
        setLocation("/");
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [user, logout, setLocation]);

  return null;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
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
      <Route path="/logs">
        <LogsPage />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InactivityHandler />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
