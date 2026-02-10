import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  File,
  Search,
  Upload,
  Download,
  Trash2,
  Loader2,
  RotateCcw,
  X,
  Eye,
  Film,
  Music,
  FileSpreadsheet
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 14 } }
};

export default function Drive() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ["drive-files"],
    queryFn: async () => {
      const { data: storageFiles, error } = await supabase.storage
        .from('sb-drive')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      return (storageFiles || []).filter(item => item.id !== null);
    }
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const cleanName = `${Date.now()}_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

      const { error } = await supabase.storage
        .from('sb-drive')
        .upload(cleanName, file, { upsert: true });

      if (error) throw error;

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["drive-files"] });
        toast({ title: "Fichier televerse", description: file.name });
        setUploading(false);
      }, 500);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) uploadFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const getFileUrl = (file: any) => {
    const { data } = supabase.storage.from('sb-drive').getPublicUrl(file.path || file.name);
    return data.publicUrl;
  };

  const getMimeType = (file: any) => file.metadata?.mimetype || '';

  const getIcon = (file: any) => {
    const type = getMimeType(file);
    if (type.startsWith('image/')) return <ImageIcon className="text-blue-400" size={22} />;
    if (type.includes('pdf')) return <FileText className="text-red-400" size={22} />;
    if (type.startsWith('video/')) return <Film className="text-purple-400" size={22} />;
    if (type.startsWith('audio/')) return <Music className="text-green-400" size={22} />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="text-emerald-400" size={22} />;
    return <File className="text-white/30" size={22} />;
  };

  const getIconColor = (file: any) => {
    const type = getMimeType(file);
    if (type.startsWith('image/')) return "border-blue-500/20 bg-blue-500/10";
    if (type.includes('pdf')) return "border-red-500/20 bg-red-500/10";
    if (type.startsWith('video/')) return "border-purple-500/20 bg-purple-500/10";
    if (type.startsWith('audio/')) return "border-green-500/20 bg-green-500/10";
    return "border-white/[0.05] bg-white/[0.03]";
  };

  const openPreview = (file: any) => {
    const url = getFileUrl(file);
    const type = getMimeType(file);
    setPreviewFile({ ...file, url, mimeType: type });
  };

  const downloadFile = (file: any) => {
    const url = getFileUrl(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.target = '_blank';
    link.click();
  };

  const deleteFile = async (file: any) => {
    try {
      const { error } = await supabase.storage.from('sb-drive').remove([file.name]);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["drive-files"] });
      toast({ title: "Fichier supprime" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const getDisplayName = (name: string) => {
    // Remove timestamp prefix: "1707465600_my_file.pdf" -> "my_file.pdf"
    return name.replace(/^\d+_/, '').replace(/_/g, ' ');
  };

  const filteredFiles = (files || []).filter((f: any) =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canPreview = (file: any) => {
    const type = getMimeType(file);
    return type.startsWith('image/') || type.includes('pdf') || type.startsWith('video/') || type.startsWith('audio/');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic mb-1">
              SB <span className="text-gold">Drive</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
              {files?.length || 0} fichiers stockes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={uploading}
              className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 h-11 px-5 rounded-xl"
            >
              <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Actualiser
            </Button>
            <label className={cn("cursor-pointer", uploading && "opacity-50 cursor-not-allowed")}>
              <Button asChild disabled={uploading} className="luxury-button px-6 h-11">
                <span>
                  {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Televerser</>
                  )}
                </span>
              </Button>
              <input type="file" className="hidden" onChange={onFileChange} disabled={uploading} />
            </label>
          </div>
        </motion.div>

        {/* Search + Drag Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "p-6 rounded-2xl border transition-all duration-300",
            dragOver
              ? "border-gold/50 bg-gold/[0.05] shadow-[0_0_30px_rgba(201,162,77,0.1)]"
              : "border-white/[0.05] bg-white/[0.02]"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-black/50 border-white/[0.08] text-white h-12 rounded-xl focus:border-gold/30"
              placeholder="Rechercher des fichiers..."
            />
          </div>
          {dragOver && (
            <p className="text-gold text-center mt-3 text-sm font-bold animate-pulse">
              Deposez votre fichier ici
            </p>
          )}
        </motion.div>

        {/* File Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-gold" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl"
          >
            <File size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
              {searchQuery ? "Aucun resultat" : "Aucun fichier"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredFiles.map((file: any) => (
              <motion.div key={file.id} variants={cardVariants} layout>
                <Card className="glass-card p-5 border-none group transition-all duration-300 hover:bg-white/[0.06] hover:border-gold/20 hover:shadow-[0_0_20px_rgba(201,162,77,0.05)] relative overflow-hidden">
                  {/* Thumbnail / Icon */}
                  <div
                    className="cursor-pointer"
                    onClick={() => canPreview(file) ? openPreview(file) : downloadFile(file)}
                  >
                    {getMimeType(file).startsWith('image/') ? (
                      <div className="h-32 rounded-xl overflow-hidden mb-4 bg-black/50">
                        <img
                          src={getFileUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border mb-4 transition-all group-hover:scale-110", getIconColor(file))}>
                        {getIcon(file)}
                      </div>
                    )}
                    <div className="space-y-1 pr-16">
                      <p className="font-bold text-white truncate text-sm">{getDisplayName(file.name)}</p>
                      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wide">
                        {file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "?"} • {new Date(file.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-5 right-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canPreview(file) && (
                      <Button
                        variant="ghost" size="icon"
                        onClick={(e) => { e.stopPropagation(); openPreview(file); }}
                        className="h-8 w-8 text-white/30 hover:text-gold hover:bg-gold/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      onClick={(e) => { e.stopPropagation(); downloadFile(file); }}
                      className="h-8 w-8 text-white/30 hover:text-gold hover:bg-gold/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteFile(file); }}
                      className="h-8 w-8 text-white/10 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-[#0A0A0A] border border-white/[0.1] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0">
                  {getIcon(previewFile)}
                  <span className="text-sm font-bold text-white truncate">{getDisplayName(previewFile.name)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => downloadFile(previewFile)}
                    className="text-white/50 hover:text-gold gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    <Download size={14} /> Telecharger
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setPreviewFile(null)}
                    className="text-white/30 hover:text-white"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
                {previewFile.mimeType?.startsWith('image/') ? (
                  <div className="flex items-center justify-center p-6 bg-black/50">
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg"
                    />
                  </div>
                ) : previewFile.mimeType?.includes('pdf') ? (
                  <iframe
                    src={`${previewFile.url}#toolbar=1&navpanes=0`}
                    className="w-full border-0"
                    style={{ height: 'calc(90vh - 70px)' }}
                    title={previewFile.name}
                  />
                ) : previewFile.mimeType?.startsWith('video/') ? (
                  <div className="flex items-center justify-center p-6 bg-black">
                    <video
                      src={previewFile.url}
                      controls
                      className="max-w-full max-h-[75vh] rounded-lg"
                    />
                  </div>
                ) : previewFile.mimeType?.startsWith('audio/') ? (
                  <div className="flex items-center justify-center p-12">
                    <audio src={previewFile.url} controls className="w-full max-w-lg" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 gap-6">
                    <div className="h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                      <File size={40} className="text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm">Apercu non disponible pour ce type de fichier</p>
                    <Button onClick={() => downloadFile(previewFile)} className="luxury-button h-12 px-8 gap-3">
                      <Download size={18} /> Telecharger le fichier
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
