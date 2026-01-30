import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
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
