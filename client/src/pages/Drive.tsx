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
  Folder, 
  MoreVertical,
  Download,
  Trash2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const mockFiles = [
  { id: 1, name: "Contrat_Alice.pdf", type: "pdf", size: "1.2 MB", date: "25 Jan 2026" },
  { id: 2, name: "Photoshoot_Bella_Full.zip", type: "archive", size: "450 MB", date: "24 Jan 2026" },
  { id: 3, name: "Planning_Fevrier.xlsx", type: "sheet", size: "45 KB", date: "23 Jan 2026" },
  { id: 4, name: "Profile_Chloe.jpg", type: "image", size: "3.4 MB", date: "22 Jan 2026" },
];

const getIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FileText className="text-red-500" />;
    case "image": return <ImageIcon className="text-blue-500" />;
    case "archive": return <Folder className="text-yellow-500" />;
    default: return <File className="text-muted-foreground" />;
  }
};

export default function Drive() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Drive</h1>
            <p className="text-muted-foreground">Stockage sécurisé de vos documents et médias.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Folder className="mr-2 h-4 w-4" /> Nouveau Dossier</Button>
            <Button><Upload className="mr-2 h-4 w-4" /> Téléverser</Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-card" placeholder="Rechercher des fichiers..." />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockFiles.map((file) => (
            <Card key={file.id} className="hover-card-effect group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {getIcon(file.type)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Télécharger</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
