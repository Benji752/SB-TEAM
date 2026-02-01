import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Copy, 
  Instagram, 
  Twitter, 
  Music2, 
  Lock,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AITools() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulation
    setTimeout(() => {
      setResults([
        "Capture l'instant présent... ✨ Ce bikini accentue parfaitement chaque courbe. Vous préférez la vue de face ou de dos ? Dites-le moi en commentaire ! #BeachVibes #SummerBody",
        "Le soleil, le sable et moi. 🌊 J'ai quelque chose de très spécial à vous montrer sur mon lien en bio... Ne le ratez pas, c'est seulement pour les vrais curieux. 🔥",
        "Parfois, tout ce dont on a besoin, c'est d'un peu de sel dans les cheveux et de sable sur la peau. 🐚 Venez me rejoindre pour une session privée ce soir, je vous attends."
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le texte a été copié dans votre presse-papiers.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 py-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
            IA <span className="text-gold">Studio</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
            Rédacteur Intelligent pour Créatrices
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Commandes */}
          <Card className="lg:col-span-5 bg-[#0A0A0A] border-white/[0.05] rounded-[2.5rem] p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sujet du post</Label>
                <Textarea 
                  placeholder="ex: Photo en bikini à la plage"
                  className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl min-h-[120px] resize-none focus:border-gold/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Ton</Label>
                  <Select defaultValue="seductrice">
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                      <SelectItem value="seductrice">Séductrice</SelectItem>
                      <SelectItem value="humoristique">Humoristique</SelectItem>
                      <SelectItem value="mysterieuse">Mystérieuse</SelectItem>
                      <SelectItem value="domina">Autoritaire/Domina</SelectItem>
                      <SelectItem value="gnd">Girl Next Door</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Plateforme</Label>
                  <Select defaultValue="instagram">
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-xl">
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="onlyfans">OnlyFans</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gold hover:bg-gold/90 text-black font-black uppercase tracking-widest text-xs h-14 rounded-xl shadow-[0_0_20px_rgba(201,162,77,0.2)] gap-2 group"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={18} className="group-hover:animate-pulse" />
                    Générer les idées
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Résultats */}
          <div className="lg:col-span-7 space-y-4">
            {results.length > 0 ? (
              results.map((result, idx) => (
                <Card key={idx} className="bg-[#0A0A0A] border-white/[0.05] rounded-3xl p-6 hover:border-gold/20 transition-all group">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-white/80 text-sm leading-relaxed italic">
                      "{result}"
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(result)}
                      className="text-white/20 hover:text-gold hover:bg-gold/10 rounded-lg shrink-0"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-white/[0.03] rounded-[2.5rem] p-12 text-center min-h-[400px]">
                <div className="h-20 w-20 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.05]">
                  <Sparkles size={32} className="text-white/10" />
                </div>
                <div className="space-y-2">
                  <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">En attente de commandes</p>
                  <p className="text-white/10 text-xs font-medium max-w-[200px]">Vos suggestions de contenu apparaîtront ici.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
