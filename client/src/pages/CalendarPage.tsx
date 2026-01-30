import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEvents } from "@/hooks/use-events";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    description: ""
  });

  const { events, isLoading, createEvent } = useEvents();

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      await createEvent.mutateAsync({
        title: formData.title,
        date: selectedDate.toISOString(),
        time: formData.time || null,
        description: formData.description || null
      });
      setIsDialogOpen(false);
      setFormData({ title: "", time: "", description: "" });
    } catch (err: any) {
      alert("Erreur lors de l'ajout : " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 bg-[#050505] min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Planning Général</h1>
            <p className="text-white/60">Gestion partagée des événements et rendez-vous.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="hover:bg-white/[0.05] text-white/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 text-white font-medium min-w-[140px] text-center border-x border-white/[0.08]">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="hover:bg-white/[0.05] text-white/70"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={() => {
                setSelectedDate(new Date());
                setIsDialogOpen(true);
              }}
              className="bg-gold hover:bg-gold/90 text-black font-bold gap-2 px-6 h-11"
            >
              <Plus className="w-5 h-5" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        <Card className="bg-[#0A0A0A]/40 border-white/[0.08] backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/[0.08]">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="py-4 text-center text-xs font-bold text-white/40 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = events?.filter(event => isSameDay(new Date(event.date), day)) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[140px] p-2 border-r border-b border-white/[0.05] transition-colors cursor-pointer group hover:bg-white/[0.02] ${
                    !isCurrentMonth ? 'opacity-20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday ? 'bg-gold text-black font-bold' : 'text-white/60 group-hover:text-white'
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                    {dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="px-2 py-1 bg-gold/10 border border-gold/20 rounded text-[10px] text-gold font-medium truncate"
                        title={event.title}
                      >
                        {event.time && <span className="mr-1 opacity-70">{event.time}</span>}
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Ajouter au planning
              {selectedDate && <span className="block text-sm font-normal text-white/50 mt-1">
                {format(selectedDate, "eeee d MMMM", { locale: fr })}
              </span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white/70">Titre du rendez-vous</Label>
              <Input
                id="title"
                placeholder="Ex: RDV Nico"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 h-11 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-white/70">Heure (Optionnel)</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 h-11 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/70">Note / Description</Label>
              <Textarea
                id="description"
                placeholder="Détails du rendez-vous..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 min-h-[100px] text-white resize-none"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Ajout..." : "Ajouter au planning"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
