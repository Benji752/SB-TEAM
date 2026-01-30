import { useState } from "react";
import { useModels } from "@/hooks/use-models";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Models() {
  const { data: models, isLoading } = useModels();
  const [search, setSearch] = useState("");

  const filteredModels = models?.filter((m: any) => 
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Modèles</h1>
          <p className="text-muted-foreground text-lg">Gérez votre liste de talents.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-9 w-full md:w-[250px] bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
      ) : !filteredModels || filteredModels.length === 0 ? (
        <div className="text-center py-20 glass-card border-none">
          <h3 className="text-xl font-bold text-white mb-2">Aucun modèle trouvé</h3>
          <p className="text-muted-foreground mb-4">La liste est actuellement vide.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map((model: any) => (
            <Card key={model.id} className="glass-card p-0 border-none group overflow-hidden transition-all duration-300 hover:bg-white/[0.06]">
              <div className="relative h-32 bg-gradient-to-br from-gold/20 to-black border-b border-white/[0.05]">
              </div>
              <CardContent className="pt-0 relative px-6 pb-6">
                <div className="flex justify-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-[#050505] shadow-2xl">
                    <AvatarImage src={model.avatar_url || ""} />
                    <AvatarFallback className="text-2xl font-black bg-white/[0.03] text-gold uppercase">
                      {model.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl text-white mb-1">{model.username}</h3>
                  <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">{model.role}</p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    ACTIF
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="bg-white/[0.02] border-t border-white/[0.05] p-4">
                <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-transparent">
                  Voir Profil
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
