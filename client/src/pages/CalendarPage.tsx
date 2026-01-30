import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function CalendarPage() {
  const days = Array.from({ length: 35 }, (_, i) => i - 4);
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Calendrier</h1>
            <p className="text-muted-foreground">Gérez les shootings et événements.</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Nouvel Événement</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl">Janvier 2026</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight size={16} /></Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Mois</Button>
              <Button variant="ghost" size="sm">Semaine</Button>
              <Button variant="ghost" size="sm">Jour</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
              {weekdays.map((d) => (
                <div key={d} className="bg-card p-4 text-center text-xs font-bold text-muted-foreground uppercase">
                  {d}
                </div>
              ))}
              {days.map((day, i) => (
                <div key={i} className="bg-card min-h-[120px] p-2 hover:bg-muted/50 transition-colors group relative">
                  <span className={cn(
                    "text-sm font-medium",
                    day === 30 ? "bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center rounded-full" : "text-muted-foreground"
                  )}>
                    {day > 0 && day <= 31 ? day : ""}
                  </span>
                  
                  {day === 12 && (
                    <div className="mt-2 p-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded border-l-2 border-blue-500">
                      Shoot Alice V. - 14h
                    </div>
                  )}
                  {day === 24 && (
                    <div className="mt-2 p-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold rounded border-l-2 border-purple-500">
                      Réunion Staff
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
