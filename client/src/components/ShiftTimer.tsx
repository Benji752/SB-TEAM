import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Clock, Moon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShiftTimerProps {
  userId: number;
}

export function ShiftTimer({ userId }: ShiftTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const response = await fetch(`/api/gamification/shift/active/${userId}`);
        const session = await response.json();
        if (session && session.isActive) {
          setIsActive(true);
          setStartTime(new Date(session.startTime));
        }
      } catch (error) {
        console.error("Error fetching active session:", error);
      }
    };
    
    fetchActiveSession();
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour >= 0 && hour < 6;
  };

  const startShift = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/gamification/shift/start", { userId });
      setIsActive(true);
      setStartTime(new Date());
      setElapsedSeconds(0);
      toast({
        title: "Shift démarré",
        description: "Bonne session de travail !",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopShift = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/gamification/shift/stop", { userId });
      const data = await response.json();
      
      setIsActive(false);
      setStartTime(null);
      setElapsedSeconds(0);
      
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile", userId] });
      
      toast({
        title: "Shift terminé",
        description: `+${data.pointsEarned} XP gagnés ! ${data.nightOwlBonus ? "🌙 Bonus Night Owl !" : ""}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-full">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <Clock size={14} className="text-green-400" />
              <span className="text-green-400 font-mono text-sm font-medium" data-testid="text-shift-timer">
                {formatTime(elapsedSeconds)}
              </span>
              {isNightTime() && (
                <Moon size={12} className="text-purple-400" />
              )}
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={stopShift}
                disabled={isLoading}
                size="sm"
                variant="ghost"
                className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-4"
                data-testid="button-stop-shift"
              >
                <Square size={14} className="mr-1 fill-current" />
                STOP
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="inactive"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={startShift}
              disabled={isLoading}
              size="sm"
              className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-4"
              data-testid="button-start-shift"
            >
              <Play size={14} className="mr-1 fill-current" />
              START SHIFT
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
