import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function CalendarPage() {
  const [calendarSrc, setCalendarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgencyCalendar = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('google_calendar_src')
        .eq('username', 'Laura')
        .single();

      if (error) throw error;
      setCalendarSrc(data?.google_calendar_src || null);
    } catch (error: any) {
      console.error("Error fetching agency calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyCalendar();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-160px)] w-full flex items-center justify-center bg-[#050505]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-200px)] w-full relative bg-[#050505] animate-in fade-in duration-700">
        <div className="h-full w-full pt-4 pb-4">
          <div className="h-full w-full rounded-3xl border border-white/10 overflow-hidden bg-black shadow-inner relative group">
            {calendarSrc ? (
              <iframe 
                src={calendarSrc} 
                style={{ border: 0 }} 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no"
                className="opacity-90 grayscale-[20%] invert-[5%] contrast-[105%]"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center space-y-4 text-white/20">
                <CalendarIcon className="h-16 w-16 opacity-5" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Aucun planning agence configuré</span>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 rounded-3xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
