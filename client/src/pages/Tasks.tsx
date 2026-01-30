import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useModels } from "@/hooks/use-models";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask, type Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const { toast } = useToast();

  const columns = [
    { id: "todo", label: "To Do", color: "bg-slate-500/10 text-slate-500" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500/10 text-blue-500" },
    { id: "completed", label: "Completed", color: "bg-green-500/10 text-green-500" },
  ];

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id: task.id, status: newStatus as any });
      toast({ title: "Task updated", description: `Moved to ${newStatus.replace('_', ' ')}` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Task deleted" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  if (isLoading) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage project workflows.</p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)] overflow-hidden">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col h-full bg-muted/20 rounded-xl border border-border/50">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <h3 className="font-bold flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full bg-current", col.color.split(' ')[1])} />
                {col.label}
              </h3>
              <Badge variant="secondary" className="bg-background">
                {tasks?.filter(t => t.status === col.id).length || 0}
              </Badge>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              {tasks?.filter(t => t.status === col.id).map(task => (
                <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4" style={{ 
                  borderLeftColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f97316' : '#22c55e'
                }}>
                  <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {task.priority}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'todo')}>Move to Todo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'in_progress')}>Move to In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task, 'completed')}>Move to Completed</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateTask();
  const { data: models } = useModels();
  
  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    }
  });

  const onSubmit = async (data: InsertTask) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Success", description: "Task created successfully" });
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
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} placeholder="Review contract" />
            {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Details about the task..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select onValueChange={(v) => form.setValue("priority", v as any)} defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assign Model (Optional)</Label>
              <Select onValueChange={(v) => form.setValue("modelId", parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models?.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
