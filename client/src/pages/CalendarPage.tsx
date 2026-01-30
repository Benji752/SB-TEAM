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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Calendrier</h1>
            <p className="text-muted-foreground text-lg">Gérez les shootings et événements.</p>
          </div>
          <Button className="luxury-button px-8 h-12"><Plus className="mr-2 h-5 w-5" /> Nouvel Événement</Button>
        </div>

        <Card className="glass-card p-0 border-none overflow-hidden">
          <div className="p-8 border-b border-white/[0.05] flex flex-row items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-bold text-white">Janvier 2026</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10 border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] rounded-xl"><ChevronLeft size={20} /></Button>
                <Button variant="outline" size="icon" className="h-10 w-10 border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] rounded-xl"><ChevronRight size={20} /></Button>
              </div>
            </div>
            <div className="flex gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
              <Button variant="ghost" size="sm" className="text-gold bg-white/[0.05] rounded-lg px-4">Mois</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white rounded-lg px-4">Semaine</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white rounded-lg px-4">Jour</Button>
            </div>
          </div>
          <div className="p-0">
            <div className="grid grid-cols-7 gap-px bg-white/[0.05]">
              {weekdays.map((d) => (
                <div key={d} className="bg-[#0A0A0A] p-6 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {d}
                </div>
              ))}
              {days.map((day, i) => (
                <div key={i} className="bg-[#050505] min-h-[140px] p-4 hover:bg-white/[0.02] transition-colors group relative border-white/[0.03]">
                  <span className={cn(
                    "text-sm font-semibold",
                    day === 30 ? "bg-gold text-black h-8 w-8 flex items-center justify-center rounded-xl shadow-xl shadow-gold/20" : "text-muted-foreground/40"
                  )}>
                    {day > 0 && day <= 31 ? day : ""}
                  </span>
                  
                  {day === 12 && (
                    <div className="mt-4 p-3 bg-white/[0.03] text-gold text-[11px] font-semibold rounded-xl border border-white/[0.05] backdrop-blur-md">
                      Shoot Alice V. - 14h
                    </div>
                  )}
                  {day === 24 && (
                    <div className="mt-4 p-3 bg-white/[0.03] text-white/80 text-[11px] font-semibold rounded-xl border border-white/[0.05] backdrop-blur-md">
                      Réunion Staff
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
