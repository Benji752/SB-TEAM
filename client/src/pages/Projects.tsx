import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, profiles!projects_user_id_fkey(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('projects')
        .insert([{
          title: newProject.title,
          description: newProject.description,
          user_id: user.id,
          status: 'En cours'
        }]);

      if (error) throw error;

      toast({ title: "Succès", description: "Projet créé avec succès" });
      setNewProject({ title: "", description: "" });
      setIsModalOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'En cours' ? 'Terminé' : 'En cours';
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message
      });
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Projets</h1>
          <p className="text-muted-foreground">Gérez vos initiatives à long terme</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-black font-bold">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Créer un projet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Titre du projet</label>
                <Input 
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-gold/50"
                  placeholder="Ex: Refonte du site web"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Textarea 
                  required
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white min-h-[120px] rounded-xl focus:border-gold/50"
                  placeholder="Détails de l'initiative..."
                />
              </div>
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gold hover:bg-gold/90 text-black font-bold h-12 rounded-xl"
              >
                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Lancer le projet"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-[280px] bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-[#0A0A0A] border-white/10 rounded-3xl overflow-hidden hover:border-gold/30 transition-all group flex flex-col">
              <CardHeader className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold text-white line-clamp-1">{project.title}</h3>
                  <Badge className={`
                    ${project.status === 'Terminé' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                    rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border
                  `}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 flex-1">
                <p className="text-muted-foreground text-sm line-clamp-4 leading-relaxed">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-between items-center border-t border-white/5 mt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage src={project.profiles?.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-white/5 text-[10px]">
                      {project.profiles?.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-white/60">{project.profiles?.username}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleUpdateStatus(project.id, project.status)}
                    className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDeleteProject(project.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
