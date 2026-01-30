import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  // Navigation items duplicate for mobile menu - ideal to refactor into const
  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Models", href: "/models" },
    { name: "Tasks", href: "/tasks" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <span className="font-display font-bold text-lg">AgencyFlow</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6">
              <span className="font-display font-bold text-xl block mb-8">
                AgencyFlow
              </span>
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors",
                        location === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {item.name}
                    </div>
                  </Link>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive mt-4"
                  onClick={() => logout()}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="md:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
