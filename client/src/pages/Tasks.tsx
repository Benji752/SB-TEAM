import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RotateCcw, Loader2, User, Flag, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("all");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("normal");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [profiles, setProfiles] = useState<any[]>([]);
  const { tasks, isLoading, createTask, toggleTask, deleteTask, resetDailyRoutine } = useTasks();
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase.from('profiles').select('id, username, role, user_id');
      if (data) setProfiles(data);
    }
    loadProfiles();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        assigned_to: newTaskAssignee === 'all' ? null : newTaskAssignee,
        priority: newTaskPriority,
      });
      setNewTaskTitle("");
      setNewTaskAssignee("all");
      setNewTaskPriority("normal");
    } catch (err: any) {
      console.error("Error adding task:", err);
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de creer la tache.",
        variant: "destructive",
      });
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: "border-l-red-500 bg-red-500/[0.03]",
    high: "border-l-orange-500 bg-orange-500/[0.02]",
    normal: "border-l-blue-500/50",
    low: "border-l-gray-500/30",
  };

  const priorityBadge: Record<string, { label: string; color: string }> = {
    urgent: { label: "URGENT", color: "bg-red-500/20 text-red-400" },
    high: { label: "HAUTE", color: "bg-orange-500/20 text-orange-400" },
    normal: { label: "NORMAL", color: "bg-blue-500/20 text-blue-400" },
    low: { label: "BASSE", color: "bg-gray-500/20 text-gray-400" },
  };

  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return "Tous";
    const profile = profiles.find(p => p.username === assignedTo || p.id === assignedTo);
    return profile?.username || assignedTo;
  };

  const filteredTasks = (tasks || []).filter((task: any) => {
    if (filterAssignee === 'all') return true;
    return task.assigned_to === filterAssignee;
  });

  const doneCount = filteredTasks.filter((t: any) => t.is_done).length;
  const totalCount = filteredTasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

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
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1 md:mb-2">Routine Quotidienne</h1>
            <p className="text-white/60 text-sm md:text-base">Checklist collaborative pour la gestion de l'agence.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => resetDailyRoutine.mutate()}
              variant="outline"
              className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 h-10 md:h-11 px-4 md:px-6 rounded-xl no-default-hover-elevate"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span> Journee
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40 font-bold uppercase tracking-widest">{doneCount}/{totalCount} terminees</span>
              <span className="text-gold font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Card className="bg-[#0A0A0A]/40 border-white/[0.08] backdrop-blur-xl p-4 md:p-6">
          {/* Add task form */}
          <form onSubmit={handleAddTask} className="space-y-3 mb-6 md:mb-8">
            <div className="flex gap-3">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ajouter une tache quotidienne..."
                className="bg-white/[0.03] border-white/[0.08] focus:border-gold/50 h-12 text-white placeholder:text-white/30 flex-1"
              />
              <Button
                type="submit"
                className="bg-gold hover:bg-gold/90 text-black font-bold h-12 px-6 rounded-xl shrink-0"
                disabled={createTask.isPending}
              >
                {createTask.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white h-9 w-40 rounded-lg text-xs">
                  <User size={12} className="mr-1 text-white/30" />
                  <SelectValue placeholder="Assigner a..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute l'equipe</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.username}>{p.username} ({p.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white h-9 w-36 rounded-lg text-xs">
                  <Flag size={12} className="mr-1 text-white/30" />
                  <SelectValue placeholder="Priorite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          {/* Filter */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.05]">
            <Filter size={14} className="text-white/20" />
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white h-8 w-44 rounded-lg text-xs">
                <SelectValue placeholder="Filtrer par..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les taches</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.username}>{p.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              {filteredTasks.length} tache(s)
            </span>
          </div>

          {/* Task list */}
          <div className="space-y-2 md:space-y-3">
            {filteredTasks?.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                Aucune tache pour le moment.
              </div>
            ) : (
              filteredTasks?.map((task: any) => {
                const prio = task.priority || 'normal';
                const badge = priorityBadge[prio] || priorityBadge.normal;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group flex items-center justify-between p-3 md:p-4 border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-all border-l-4",
                      priorityColors[prio] || "",
                      task.is_done && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <Checkbox
                        checked={task.is_done}
                        onCheckedChange={(checked) => toggleTask.mutate({ id: task.id, is_done: !!checked })}
                        className="border-white/20 data-[state=checked]:bg-gold data-[state=checked]:border-gold h-5 w-5 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-white transition-all text-sm md:text-base block truncate",
                          task.is_done && "text-white/30 line-through"
                        )}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.assigned_to && (
                            <span className="text-[10px] bg-white/[0.05] text-white/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                              <User size={9} /> {getAssigneeName(task.assigned_to)}
                            </span>
                          )}
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide", badge.color)}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask.mutate(task.id)}
                      className="text-white/20 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
