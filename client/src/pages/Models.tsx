import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Calendar as CalendarIcon,
  Mail,
  X,
  Plus,
  Trash2,
  Shield,
  UserPlus,
  Pencil,
  Check,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGamificationData } from "@/hooks/useGamificationData";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: number | null;
  username: string;
  role: string;
  avatar_url: string;
  google_calendar_src: string | null;
  email?: string;
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const { isUserOnline } = useGamificationData();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Admin: Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("model");
  const [creating, setCreating] = useState(false);

  // Admin: Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Admin: Edit role inline
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("role", { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase();
    if (r === "admin")
      return (
        <Badge className="bg-gold text-black border-gold/50 font-black uppercase tracking-widest text-[10px] px-3">
          Admin
        </Badge>
      );
    if (r === "staff")
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black uppercase tracking-widest text-[10px] px-3">
          Staff
        </Badge>
      );
    return (
      <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 font-black uppercase tracking-widest text-[10px] px-3">
        Model
      </Badge>
    );
  };

  // --- Admin: Create user via Supabase Auth + profile ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: "Champs requis", description: "Remplis le nom, l'email et le mot de passe.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        email_confirm: true,
      });

      if (authError) {
        // Fallback: use signUp if admin API not available
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: newEmail,
          password: newPassword,
        });
        if (signUpError) throw signUpError;

        const uid = signUpData.user?.id;
        if (!uid) throw new Error("Impossible de creer l'utilisateur auth");

        // 2. Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: uid,
          username: newUsername.trim(),
          role: newRole,
        });
        if (profileError) throw profileError;
      } else {
        const uid = authData.user?.id;
        if (!uid) throw new Error("Impossible de creer l'utilisateur auth");

        const { error: profileError } = await supabase.from("profiles").insert({
          id: uid,
          username: newUsername.trim(),
          role: newRole,
        });
        if (profileError) throw profileError;
      }

      toast({ title: "Utilisateur cree", description: `${newUsername} (${newRole})` });
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("model");
      setShowCreateForm(false);
      await fetchProfiles();
    } catch (err: any) {
      console.error("Create user error:", err);
      toast({ title: "Erreur", description: err?.message || "Impossible de creer l'utilisateur.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // --- Admin: Delete user ---
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete dependent records first (foreign key constraints)
      await supabase.from("activity_logs").delete().eq("user_id", deleteTarget.id);
      await supabase.from("messages").delete().eq("sender_id", deleteTarget.id);
      await supabase.from("messages").delete().eq("receiver_id", deleteTarget.id);

      // Delete profile from Supabase
      const { error } = await supabase.from("profiles").delete().eq("id", deleteTarget.id);
      if (error) throw error;

      // Also try deleting from users table (numeric id)
      if (deleteTarget.user_id) {
        await supabase.from("users").delete().eq("id", deleteTarget.user_id);
        await supabase.from("gamification_profiles").delete().eq("user_id", deleteTarget.user_id);
      }

      toast({ title: "Utilisateur supprime", description: `${deleteTarget.username} a ete supprime.` });
      setDeleteTarget(null);
      await fetchProfiles();
    } catch (err: any) {
      console.error("Delete user error:", err);
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // --- Admin: Update role ---
  const handleUpdateRole = async (profileId: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ role: editRoleValue }).eq("id", profileId);
      if (error) throw error;

      // Also update users table if user_id exists
      const profile = profiles.find((p) => p.id === profileId);
      if (profile?.user_id) {
        await supabase.from("users").update({ role: editRoleValue }).eq("id", profile.user_id);
      }

      toast({ title: "Role mis a jour", description: `${profile?.username} → ${editRoleValue}` });
      setEditingRoleId(null);
      await fetchProfiles();
    } catch (err: any) {
      console.error("Update role error:", err);
      toast({ title: "Erreur", description: err?.message || "Impossible de modifier le role.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-160px)] w-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              SB <span className="text-gold">Equipe</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
              Gestion des talents et collaborateurs
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gold hover:bg-gold/90 text-black font-bold h-11 px-6 rounded-xl gap-2"
            >
              {showCreateForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {showCreateForm ? "Fermer" : "Creer un utilisateur"}
            </Button>
          )}
        </div>

        {/* Admin: Create user form */}
        {isAdmin && showCreateForm && (
          <Card className="bg-[#0A0A0A]/60 border-white/[0.08] backdrop-blur-xl p-6 space-y-4">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest">Nouvel utilisateur</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Nom d'utilisateur</label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Sophie"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Email</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sophie@sb.digital"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Mot de passe</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caracteres"
                  className="bg-white/[0.03] border-white/[0.08] text-white h-11 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider">Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={creating} className="bg-gold hover:bg-gold/90 text-black font-bold h-11 w-full rounded-xl">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Creer
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="group bg-[#0A0A0A] border-white/[0.05] hover:border-gold/30 rounded-3xl p-6 transition-all cursor-pointer hover-elevate active-elevate-2 flex flex-col items-center text-center space-y-4 relative"
            >
              {/* Admin actions overlay */}
              {isAdmin && profile.id !== currentUser?.id && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRoleId(profile.id);
                      setEditRoleValue(profile.role);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-gold/20 text-white/30 hover:text-gold transition-all"
                    title="Modifier le role"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(profile);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div onClick={() => setSelectedUser(profile)}>
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-white/5 group-hover:border-gold/30 transition-colors shadow-2xl">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-white/5 text-gold text-2xl font-black italic">
                      {profile.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute bottom-0 right-0 w-5 h-5 border-4 border-[#0A0A0A] rounded-full shadow-lg ${
                      isUserOnline(profile.user_id ?? 0) ? "bg-[#10B981]" : "bg-gray-500"
                    }`}
                    title={isUserOnline(profile.user_id ?? 0) ? "En ligne" : "Hors ligne"}
                  />
                </div>
              </div>

              <div className="space-y-2" onClick={() => setSelectedUser(profile)}>
                <h3 className="text-xl font-bold text-white tracking-tight">{profile.username}</h3>
                {/* Inline role edit */}
                {editingRoleId === profile.id ? (
                  <div className="flex items-center gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                    <Select value={editRoleValue} onValueChange={setEditRoleValue}>
                      <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleUpdateRole(profile.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingRoleId(null)}
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.05] text-white/30 hover:bg-white/[0.1] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  getRoleBadge(profile.role)
                )}
              </div>

              <div className="w-full pt-4 border-t border-white/[0.05] flex justify-center" onClick={() => setSelectedUser(profile)}>
                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest group-hover:text-gold transition-colors">
                  Voir le planning →
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="max-w-4xl bg-[#050505] border-white/[0.08] text-white p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <div className="relative h-full flex flex-col">
              <div className="p-10 bg-white/[0.02] border-b border-white/[0.05] flex flex-col md:flex-row items-center gap-8">
                <Avatar className="h-32 w-32 border-4 border-white/5 shadow-2xl">
                  <AvatarImage src={selectedUser?.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black italic text-gold">
                    {selectedUser?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                      {selectedUser?.username}
                    </h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      {getRoleBadge(selectedUser?.role || "")}
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <Mail className="h-3 w-3 text-gold" />
                        <span>{selectedUser?.username.toLowerCase()}@sb.digital</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin actions in detail dialog */}
                  {isAdmin && selectedUser && selectedUser.id !== currentUser?.id && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(null);
                          setEditingRoleId(selectedUser.id);
                          setEditRoleValue(selectedUser.role);
                        }}
                        className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.05] gap-2 rounded-xl text-xs"
                      >
                        <Shield className="w-3.5 h-3.5" /> Modifier le role
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(null);
                          setDeleteTarget(selectedUser);
                        }}
                        className="border-red-500/20 bg-red-500/[0.05] text-red-400 hover:bg-red-500/[0.1] gap-2 rounded-xl text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gold" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest italic">
                    Planning de la semaine
                  </h3>
                </div>

                <div className="aspect-video w-full bg-black rounded-[2rem] border border-white/5 overflow-hidden relative shadow-inner">
                  {selectedUser?.google_calendar_src ? (
                    <iframe
                      src={selectedUser.google_calendar_src}
                      style={{ border: 0 }}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      className="opacity-90 grayscale-[30%] invert-[5%] contrast-[110%]"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-4 text-white/20">
                      <CalendarIcon className="h-16 w-16 opacity-5" />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Pas de planning</span>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 rounded-[2rem]" />
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-all border border-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-[#0A0A0A] border-white/[0.08] text-white rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-lg font-bold">
                Supprimer {deleteTarget?.username} ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                Cette action est irreversible. Le profil de <strong className="text-white">{deleteTarget?.username}</strong>{" "}
                sera definitivement supprime ainsi que ses donnees de gamification.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-white hover:bg-white/[0.1] rounded-xl">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
