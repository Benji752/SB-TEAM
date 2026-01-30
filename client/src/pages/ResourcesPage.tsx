import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useResources } from "@/hooks/use-resources";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ResourcesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: ""
  });

  const { resources, isLoading, createResource, deleteResource } = useResources();
  const { toast } = useToast();

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({
      title: "Copié !",
      description: "Le contenu a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResource.mutateAsync(formData);
      setIsDialogOpen(false);
      setFormData({ title: "", content: "", category: "" });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    try {
      await deleteResource.mutateAsync(id);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 bg-[#050505] min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Ressources / Liens</h1>
            <p className="text-white/60">Templates, liens de paiement et informations utiles.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-black font-bold gap-2 px-6 h-11">
                <Plus className="w-5 h-5" />
                Ajouter une ressource
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Nouvelle Ressource</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white/70">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 h-11 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white/70">Catégorie</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 h-11 text-white"
                    placeholder="ex: Paiement, Template..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white/70">Contenu (Texte ou Lien)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="bg-white/[0.03] border-white/[0.1] focus:border-gold/50 min-h-[120px] text-white resize-none"
                    required
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12"
                    disabled={createResource.isPending}
                  >
                    {createResource.isPending ? "Ajout..." : "Ajouter au planning"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources?.map((resource) => (
              <Card key={resource.id} className="bg-[#0A0A0A]/40 border-white/[0.08] backdrop-blur-xl group hover:bg-[#0A0A0A]/60 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    {resource.category && (
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest px-2 py-0.5 bg-gold/10 rounded-full">
                        {resource.category}
                      </span>
                    )}
                    <CardTitle className="text-lg font-bold text-white block mt-1">{resource.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(resource.id)}
                    className="text-white/20 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/60 text-sm line-clamp-3 font-mono bg-black/20 p-3 rounded-lg border border-white/[0.03]">
                    {resource.content}
                  </p>
                  <Button
                    onClick={() => handleCopy(resource.content, resource.id)}
                    className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] font-semibold gap-2 h-11 no-default-hover-elevate"
                  >
                    {copiedId === resource.id ? (
                      <><Check className="w-4 h-4 text-green-500" /> Copié !</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copier</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
