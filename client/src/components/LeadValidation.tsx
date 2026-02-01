import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, X, Clock, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLevelUpConfetti } from "@/hooks/use-confetti";

interface HunterLead {
  id: number;
  clientUsername: string;
  platform: string;
  finderId: number;
  status: string;
  createdAt: string;
}

const USER_NAMES: Record<number, string> = {
  1: "Nico",
  2: "WildGirl",
};

const PLATFORM_COLORS: Record<string, string> = {
  stripchat: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  twitter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  instagram: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  telegram: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  discord: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function LeadValidation() {
  const { toast } = useToast();
  const { triggerSimple } = useLevelUpConfetti();

  const { data: pendingLeads = [], isLoading } = useQuery<HunterLead[]>({
    queryKey: ["/api/gamification/leads/pending"],
    refetchInterval: 10000,
  });

  const validateMutation = useMutation({
    mutationFn: async ({ leadId, approved }: { leadId: number; approved: boolean }) => {
      return apiRequest("PATCH", `/api/gamification/leads/${leadId}/validate`, { approved });
    },
    onSuccess: async (response, { approved }) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leads/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/activity"] });
      
      if (approved) {
        triggerSimple();
      }
      
      toast({
        title: approved ? "Chasse réussie !" : "Chasse refusée",
        description: approved ? `+${data.xpAwarded} XP attribués` : "Aucun XP attribué",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      </Card>
    );
  }

  if (pendingLeads.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-gold" />
        <h3 className="text-white font-bold uppercase tracking-wider text-sm">
          Chasses à valider
        </h3>
        <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full ml-auto">
          {pendingLeads.length}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pendingLeads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">@{lead.clientUsername}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[lead.platform] || PLATFORM_COLORS.other}`}>
                    {lead.platform}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                  <span>Par {USER_NAMES[lead.finderId] || `User ${lead.finderId}`}</span>
                  <Clock size={10} />
                  <span>{new Date(lead.createdAt).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => validateMutation.mutate({ leadId: lead.id, approved: true })}
                    disabled={validateMutation.isPending}
                    className="bg-green-500/20 text-green-400 border border-green-500/30 h-8 w-8 p-0"
                    data-testid={`button-approve-lead-${lead.id}`}
                  >
                    <Check size={16} />
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => validateMutation.mutate({ leadId: lead.id, approved: false })}
                    disabled={validateMutation.isPending}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 h-8 w-8 p-0"
                    data-testid={`button-reject-lead-${lead.id}`}
                  >
                    <X size={16} />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
