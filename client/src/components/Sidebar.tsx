import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar, 
  UserCircle, 
  CheckSquare, 
  HardDrive,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navigation = [
    { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
    { name: "Prospects", href: "/prospects", icon: Users },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Calendrier", href: "/calendar", icon: Calendar },
    { name: "Modèles", href: "/models", icon: UserCircle },
    { name: "Tâches", href: "/tasks", icon: CheckSquare },
    { name: "Drive", href: "/drive", icon: HardDrive },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r fixed h-screen overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">AgencyFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 mt-4">
          Principal
        </div>
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <div
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-200",
                location === item.href
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                location === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
              {location === item.href && (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 mb-2 px-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.firstName?.[0]}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <Separator />

        <Link href="/settings">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors",
            location === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          )}>
            <Settings className="mr-3 h-5 w-5" />
            Paramètres
          </div>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive no-default-hover-elevate"
          onClick={() => logout()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
