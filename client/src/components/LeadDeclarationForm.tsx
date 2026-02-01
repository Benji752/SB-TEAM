import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Target, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeadDeclarationFormProps {
  userId: number;
}

const PLATFORMS = [
  { value: "stripchat", label: "Stripchat" },
  { value: "twitter", label: "Twitter/X" },
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "discord", label: "Discord" },
  { value: "other", label: "Autre" },
];

export function LeadDeclarationForm({ userId }: LeadDeclarationFormProps) {
  const [open, setOpen] = useState(false);
  const [clientUsername, setClientUsername] = useState("");
  const [platform, setPlatform] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientUsername.trim() || !platform) {
      toast({
        title: "Champs requis",
        description: "Remplis le nom du client et la plateforme",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/gamification/leads", {
        clientUsername: clientUsername.trim(),
        platform,
        finderId: userId,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/leads/pending"] });
      
      toast({
        title: "Lead déclaré !",
        description: "En attente de validation par l'admin",
      });
      
      setClientUsername("");
      setPlatform("");
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-gold/20 text-gold border border-gold/30 rounded-xl"
            data-testid="button-declare-lead"
          >
            <Target size={16} className="mr-2" />
            DÉCLARER UNE PRISE
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-gold flex items-center gap-2">
            <Target size={20} />
            Nouvelle Prise
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Nom du client</Label>
            <Input
              value={clientUsername}
              onChange={(e) => setClientUsername(e.target.value)}
              placeholder="@username ou pseudo"
              className="bg-white/5 border-white/10 text-white"
              data-testid="input-client-username"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Plateforme</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-platform">
                <SelectValue placeholder="Choisis la plateforme" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10">
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-white">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold text-black"
              data-testid="button-submit-lead"
            >
              <Send size={16} className="mr-2" />
              {isLoading ? "Envoi..." : "Déclarer"}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
