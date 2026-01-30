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
            <h1 className="text-3xl font-display font-bold text-gold">Calendrier</h1>
            <p className="text-muted-foreground">Gérez les shootings et événements.</p>
          </div>
          <Button className="bg-gold text-black hover:bg-gold/90 gold-glow"><Plus className="mr-2 h-4 w-4" /> Nouvel Événement</Button>
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gold/10">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl text-gold">Janvier 2026</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 border-gold/20 text-gold hover:bg-gold/10"><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 border-gold/20 text-gold hover:bg-gold/10"><ChevronRight size={16} /></Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gold/30 text-gold bg-gold/10">Mois</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold">Semaine</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold">Jour</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-px bg-gold/10 overflow-hidden">
              {weekdays.map((d) => (
                <div key={d} className="bg-black/40 p-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {d}
                </div>
              ))}
              {days.map((day, i) => (
                <div key={i} className="bg-black/20 min-h-[120px] p-2 hover:bg-white/5 transition-colors group relative border-r border-b border-gold/5">
                  <span className={cn(
                    "text-sm font-medium",
                    day === 30 ? "bg-gold text-black h-6 w-6 flex items-center justify-center rounded-full shadow-lg shadow-gold/20" : "text-muted-foreground"
                  )}>
                    {day > 0 && day <= 31 ? day : ""}
                  </span>
                  
                  {day === 12 && (
                    <div className="mt-2 p-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border-l-2 border-blue-500 glass-card">
                      Shoot Alice V. - 14h
                    </div>
                  )}
                  {day === 24 && (
                    <div className="mt-2 p-1.5 bg-gold/10 text-gold text-[10px] font-bold rounded border-l-2 border-gold glass-card">
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
