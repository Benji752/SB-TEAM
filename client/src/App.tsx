import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Models from "@/pages/Models";
import Tasks from "@/pages/Tasks";
import CalendarPage from "@/pages/CalendarPage";
import ResourcesPage from "@/pages/ResourcesPage";
import Settings from "@/pages/Settings";
import Orders from "@/pages/Orders";
import Messages from "@/pages/Messages";
import Drive from "@/pages/Drive";
import NotFound from "@/pages/NotFound";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/messages">
        {user ? <Messages /> : <Landing />}
      </Route>
      <Route path="/calendar">
        {user ? <CalendarPage /> : <Landing />}
      </Route>
      <Route path="/resources">
        {user ? <ResourcesPage /> : <Landing />}
      </Route>
      <Route path="/models">
        {user ? <Models /> : <Landing />}
      </Route>
      <Route path="/tasks">
        {user ? <Tasks /> : <Landing />}
      </Route>
      <Route path="/orders">
        {user ? <Orders /> : <Landing />}
      </Route>
      <Route path="/drive">
        {user ? <Drive /> : <Landing />}
      </Route>
      <Route path="/settings">
        {user ? <Settings /> : <Landing />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
