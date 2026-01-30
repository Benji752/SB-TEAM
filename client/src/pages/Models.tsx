import { useState } from "react";
import { useModels, useCreateModel, useDeleteModel } from "@/hooks/use-models";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Search, Instagram, Trash2, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertModelSchema, type InsertModel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Models() {
  const { data: models, isLoading } = useModels();
  const [search, setSearch] = useState("");
  const deleteMutation = useDeleteModel();
  const { toast } = useToast();

  const filteredModels = models?.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this model?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Model deleted", description: "Successfully removed from database." });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete model.", variant: "destructive" });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Models</h1>
          <p className="text-muted-foreground mt-1">Manage your talent roster.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search models..." 
              className="pl-9 w-full md:w-[250px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <CreateModelDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-[280px] rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : filteredModels?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <h3 className="text-xl font-bold text-muted-foreground">No models found</h3>
          <p className="text-muted-foreground mb-4">Add your first model to get started.</p>
          <CreateModelDialog />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels?.map((model) => (
            <Card key={model.id} className="overflow-hidden hover-card-effect group">
              <div className="relative h-32 bg-gradient-to-br from-primary/80 to-purple-600/80">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 border-none text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(model.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="pt-0 relative">
                <div className="flex justify-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    <AvatarImage src={model.profileImage || ""} />
                    <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                      {model.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg leading-none mb-1">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.email || "No email"}</p>
                </div>

                <div className="flex justify-center gap-2 mb-4">
                  <Badge variant={model.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {model.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {model.instagramHandle && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Instagram className="h-4 w-4 mr-2" />
                      @{model.instagramHandle}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-3">
                <Button variant="ghost" className="w-full text-xs h-8">View Profile</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function CreateModelDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateModel();
  
  const form = useForm<InsertModel>({
    resolver: zodResolver(insertModelSchema),
    defaultValues: {
      name: "",
      email: "",
      status: "active",
      instagramHandle: "",
      onlyFansHandle: ""
    }
  });

  const onSubmit = async (data: InsertModel) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Success", description: "Model created successfully" });
      setOpen(false);
      form.reset();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Model
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Model</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...form.register("name")} placeholder="Jane Doe" />
            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...form.register("email")} type="email" placeholder="jane@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input {...form.register("instagramHandle")} placeholder="@username" />
            </div>
            <div className="space-y-2">
              <Label>OnlyFans</Label>
              <Input {...form.register("onlyFansHandle")} placeholder="username" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Model
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
