import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // First try demo session auth
      try {
        const sessionResponse = await fetch("/api/user");
        if (sessionResponse.ok) {
          const sessionUser = await sessionResponse.json();
          if (sessionUser && sessionUser.id) {
            return sessionUser;
          }
        }
      } catch (e) {
        // Fall back to Supabase
      }
      
      // Try Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      // Fetch profile associated with user
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { ...user, ...profile };
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logout = async () => {
    // Try demo logout first
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {}
    
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    logout,
    error
  };
}
