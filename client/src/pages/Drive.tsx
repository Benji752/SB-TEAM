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
  Loader2,
  RotateCcw
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

  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ["drive-files"],
    queryFn: async () => {
      // First, get the list of files from the storage bucket root
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('sb-drive')
        .list('', { 
          sortBy: { column: 'created_at', order: 'desc' } 
        });

      if (storageError) throw storageError;
      
      // Filter out folders (items without an id or specific metadata that indicates it's a file)
      // In Supabase storage list, files have metadata, folders usually don't or have specific properties
      const filesOnly = storageFiles.filter(item => item.id !== null);
      console.log('Fichiers réels trouvés:', filesOnly);

      return filesOnly;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      // Nettoyage du nom de fichier : remplace tout ce qui n'est pas alphanumérique par des underscores
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const cleanName = `${Date.now()}_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const filePath = cleanName; // DIRECTLY AT ROOT

      const { error: uploadError } = await supabase.storage
        .from('sb-drive')
        .upload(filePath, file, {
          upsert: true // Allow overwriting if file exists
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sb-drive')
        .getPublicUrl(filePath);

      // We still log the asset in DB for easier tracking if needed, 
      // but the source of truth for the list is now the storage bucket directly
      const { error: dbError } = await supabase
        .from('drive_assets')
        .upsert({
          name: cleanName,
          url: publicUrl,
          size: file.size,
          type: file.type,
          owner_id: user?.id
        }, { onConflict: 'name' });

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

  const getIcon = (metadata: any) => {
    const type = metadata?.mimetype || '';
    if (type.startsWith('image/')) return <ImageIcon className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="text-red-500" />;
    return <File className="text-muted-foreground" />;
  };

  const openFile = (file: any) => {
    const { data } = supabase.storage.from('sb-drive').getPublicUrl(file.path || file.name);
    window.open(data.publicUrl, '_blank');
  };

  const deleteFile = async (file: any) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('sb-drive')
        .remove([file.name]);
      
      if (storageError) throw storageError;

      // Also remove from DB
      await supabase
        .from('drive_assets')
        .delete()
        .eq('name', file.name);

      queryClient.invalidateQueries({ queryKey: ["drive-files"] });
      toast({ title: "Succès", description: "Fichier supprimé." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Drive</h1>
            <p className="text-muted-foreground text-lg">Stockage sécurisé SB Digital.</p>
            <p className="text-gold text-sm mt-2 font-medium">Fichiers trouvés : {files?.length || 0}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 h-12 px-6 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Actualiser
            </Button>
            <label className="cursor-pointer">
              <Button asChild disabled={uploading} className="luxury-button px-8 h-12">
                <span>
                  {uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                  Téléverser
                </span>
              </Button>
              <input type="file" className="hidden" onChange={onFileChange} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.05] mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input className="pl-12 bg-black border-white/[0.08] text-white h-12 rounded-xl focus:ring-gold/20" placeholder="Rechercher des fichiers..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {files?.map((file: any) => (
              <Card 
                key={file.id} 
                className="glass-card p-6 border-none group transition-all duration-300 hover:bg-white/[0.06] relative" 
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => openFile(file)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05] group-hover:border-gold/30 group-hover:bg-gold/5 transition-all">
                      {getIcon(file.metadata)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 pr-12">
                      <p className="font-bold text-white truncate text-base">{file.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                      {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFile(file);
                    }}
                    className="h-8 w-8 text-white/30 hover:text-gold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file);
                    }}
                    className="h-8 w-8 text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-3xl glass-card border-none p-10 backdrop-blur-3xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-bold text-white">{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8">
            {selectedFile?.type.startsWith('image/') ? (
              <img src={selectedFile.url} alt={selectedFile.name} className="max-h-[60vh] rounded-2xl object-contain shadow-2xl border border-white/[0.05]" />
            ) : (
              <div className="h-60 w-60 bg-white/[0.03] rounded-[32px] flex items-center justify-center border border-white/[0.05]">
                <div className="scale-[2.5]">{selectedFile && getIcon(selectedFile.type)}</div>
              </div>
            )}
            <div className="flex gap-4 w-full">
              <Button asChild className="luxury-button flex-1 h-14 text-lg">
                <a href={selectedFile?.url} download target="_blank">
                  <Download className="mr-3 h-6 w-6" /> Télécharger
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
