import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useModels() {
  return useQuery({
    queryKey: ["supabase-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'model')
        .order('username', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}
