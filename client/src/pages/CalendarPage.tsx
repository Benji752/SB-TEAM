import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Settings, Loader2, Save } from "lucide-react";

export default function CalendarPage() {
  const [calendarSrc, setCalendarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [newSrc, setNewSrc] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('google_calendar_src')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCalendarSrc(data?.google_calendar_src || null);
      if (data?.google_calendar_src) setNewSrc(data.google_calendar_src);
    } catch (error: any) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!newSrc.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('profiles')
        .update({ google_calendar_src: newSrc })
        .eq('id', user.id);

      if (error) throw error;

      setCalendarSrc(newSrc);
      setShowConfig(false);
      toast({ title: "Succès", description: "Agenda mis à jour" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!calendarSrc || showConfig) {
    return (
      <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="w-full max-w-xl bg-[#0A0A0A] border-white/10 rounded-3xl p-10 space-y-8 shadow-2xl relative">
          {calendarSrc && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowConfig(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          
          <div className="text-center space-y-4">
            <div className="h-20 w-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
              <CalendarIcon className="h-10 w-10 text-gold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Connecter votre Planning Google</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Collez l'URL d'intégration (src) de votre Google Agenda Public pour l'afficher ici.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Lien d'intégration (iframe src)</label>
              <Input 
                value={newSrc}
                onChange={(e) => setNewSrc(e.target.value)}
                placeholder="https://calendar.google.com/calendar/embed?src=..."
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:border-gold/50"
              />
            </div>
            <Button 
              onClick={handleSave}
              disabled={saving || !newSrc}
              className="w-full h-14 bg-gold hover:bg-gold/90 text-black font-bold uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(201,162,77,0.3)]"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <><Save className="mr-2 h-4 w-4" /> Sauvegarder la configuration</>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/30 text-center leading-relaxed italic">
              Note : Assurez-vous que votre agenda est configuré comme "Public" dans les paramètres Google Agenda pour que l'intégration fonctionne.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative bg-[#050505] animate-in fade-in duration-700">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setShowConfig(true)}
        className="absolute top-4 right-4 z-50 bg-black/60 backdrop-blur-md text-white/60 hover:text-white border border-white/10 hover:border-gold/50 rounded-full h-10 w-10 transition-all shadow-xl"
        title="Configuration"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
      <div className="h-full w-full pt-16 pb-4 px-4 lg:px-8">
        <div className="h-full w-full rounded-3xl border border-white/10 overflow-hidden bg-black shadow-inner relative group">
          <iframe 
            src={calendarSrc} 
            style={{ border: 0 }} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no"
            className="opacity-90 grayscale-[20%] invert-[5%] contrast-[105%]"
          />
          <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
