import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Tasks() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { tasks, isLoading, createTask, toggleTask, deleteTask, resetDailyRoutine } = useTasks();

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask.mutateAsync(newTaskTitle);
      setNewTaskTitle("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 bg-[#050505] min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Routine Quotidienne</h1>
            <p className="text-white/60">Checklist collaborative pour la gestion de l'agence.</p>
          </div>
          <Button 
            onClick={() => resetDailyRoutine.mutate()}
            variant="outline"
            className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 h-11 px-6 rounded-xl no-default-hover-elevate"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Journée
          </Button>
        </div>

        <Card className="bg-[#0A0A0A]/40 border-white/[0.08] backdrop-blur-xl p-6">
          <form onSubmit={handleAddTask} className="flex gap-4 mb-8">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ajouter une tâche quotidienne..."
              className="bg-white/[0.03] border-white/[0.08] focus:border-gold/50 h-12 text-white placeholder:text-white/30"
            />
            <Button 
              type="submit" 
              className="bg-gold hover:bg-gold/90 text-black font-bold h-12 px-6 rounded-xl"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </Button>
          </form>

          <div className="space-y-3">
            {tasks?.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                Aucune tâche pour le moment.
              </div>
            ) : (
              tasks?.map((task) => (
                <div 
                  key={task.id}
                  className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={task.is_done}
                      onCheckedChange={(checked) => toggleTask.mutate({ id: task.id, is_done: !!checked })}
                      className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold h-5 w-5 rounded"
                    />
                    <span className={cn(
                      "text-white transition-all",
                      task.is_done && "text-white/30 line-through"
                    )}>
                      {task.title}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-white/20 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
