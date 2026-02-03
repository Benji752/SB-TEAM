import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.stats.get.path, { credentials: "include" });
        if (!res.ok || res.status === 204) {
          console.warn(`[useStats] Fallback: status ${res.status}`);
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("[useStats] Error:", error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}
