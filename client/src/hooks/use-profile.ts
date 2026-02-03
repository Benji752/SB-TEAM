import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertProfile } from "@shared/schema";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.profiles.me.path, { credentials: "include" });
        if (res.status === 404 || res.status === 204) return null;
        if (!res.ok) {
          console.warn(`[useProfile] Fallback: status ${res.status}`);
          return null;
        }
        const data = await res.json();
        return data || null;
      } catch (error) {
        console.error("[useProfile] Error:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<InsertProfile>) => {
      const res = await fetch(api.profiles.update.path, {
        method: api.profiles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}
