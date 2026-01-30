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
      // First, get the list of files from the storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('sb-drive')
        .list();

      if (storageError) throw storageError;

      // Then, get the metadata from the drive_assets table
      const { data: assets, error: assetsError } = await supabase
        .from('drive_assets')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (assetsError) throw assetsError;

      // Return assets that exist in storage
      return assets;
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

  const openFile = (file: any) => {
    const { data } = supabase.storage.from('sb-drive').getPublicUrl(file.path || file.name);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Drive</h1>
            <p className="text-muted-foreground text-lg">Stockage sécurisé SB Digital.</p>
          </div>
          <div className="flex gap-2">
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
                className="glass-card p-6 border-none group cursor-pointer transition-all duration-300 hover:bg-white/[0.06]" 
                onClick={() => openFile(file)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05] group-hover:border-gold/30 group-hover:bg-gold/5 transition-all">
                    {getIcon(file.type)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white truncate text-base">{file.name}</p>
                    <Download className="w-3.5 h-3.5 text-white/30 group-hover:text-gold transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
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
