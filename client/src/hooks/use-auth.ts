import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // Check cookie-based auth (mock/demo mode)
      try {
        const sessionResponse = await fetch("/api/user", { credentials: "include" });
        if (sessionResponse.ok) {
          const sessionUser = await sessionResponse.json();
          if (sessionUser && sessionUser.id) {
            return sessionUser;
          }
        }
      } catch {
        // Fall back to Supabase
      }

      // Try Supabase auth
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return { ...user, ...profile };
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logout = async () => {
    // Clear cookie-based session
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {}

    // Clear Supabase session
    await supabase.auth.signOut();

    // Clear cookie manually as fallback
    document.cookie = "sb-user-id=; path=/; max-age=0";

    // Clear all caches
    queryClient.clear();

    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    logout,
    error
  };
}
