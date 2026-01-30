import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  Search, 
  Upload, 
  MoreVertical,
  Download,
  Trash2,
  Loader2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Drive() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["drive-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drive_assets')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sb-drive')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sb-drive')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('drive_assets')
        .insert({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
          owner_id: user?.id
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-files"] });
      toast({ title: "Succès", description: "Fichier téléversé avec succès." });
      setUploading(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setUploading(false);
    }
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="text-red-500" />;
    return <File className="text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gold">Drive</h1>
            <p className="text-muted-foreground">Stockage sécurisé SB Digital.</p>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Button asChild disabled={uploading} className="bg-gold text-black hover:bg-gold/90 gold-glow">
                <span>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Téléverser
                </span>
              </Button>
              <input type="file" className="hidden" onChange={onFileChange} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-gold/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-black/50 border-gold/20 text-white" placeholder="Rechercher des fichiers..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {files?.map((file: any) => (
              <Card key={file.id} className="glass-card gold-glow cursor-pointer" onClick={() => setSelectedFile(file)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      {getIcon(file.type)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate text-white">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-3xl glass-card premium-border">
          <DialogHeader>
            <DialogTitle className="text-gold">{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedFile?.type.startsWith('image/') ? (
              <img src={selectedFile.url} alt={selectedFile.name} className="max-h-[60vh] rounded-lg object-contain border border-gold/20" />
            ) : (
              <div className="h-40 w-40 bg-gold/10 rounded-2xl flex items-center justify-center">
                {selectedFile && getIcon(selectedFile.type)}
              </div>
            )}
            <div className="flex gap-4">
              <Button asChild className="bg-gold text-black hover:bg-gold/90 gold-glow">
                <a href={selectedFile?.url} download target="_blank">
                  <Download className="mr-2 h-4 w-4" /> Télécharger
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
