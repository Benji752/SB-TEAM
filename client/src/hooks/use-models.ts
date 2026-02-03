import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useModels() {
  return useQuery({
    queryKey: ["supabase-models"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'model')
          .order('username', { ascending: true });
        
        if (error) {
          console.warn("[useModels] Supabase error:", error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("[useModels] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}
