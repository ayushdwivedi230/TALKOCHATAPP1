import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Define input types locally to match schema if not exported from routes directly
type CreateSessionInput = Record<string, never>; // Empty object
type UpdateSessionInput = {
  completedLevel?: number;
  reachedFinale?: boolean;
};

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.sessions.create.path, {
        method: api.sessions.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to create session');
      return api.sessions.create.responses[201].parse(await res.json());
    },
    // We don't have a list query to invalidate yet, but this sets us up for future
  });
}

export function useUpdateSession() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateSessionInput) => {
      const validated = api.sessions.update.input.parse(updates);
      const url = buildUrl(api.sessions.update.path, { id });
      
      const res = await fetch(url, {
        method: api.sessions.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error('Failed to update session');
      return api.sessions.update.responses[200].parse(await res.json());
    },
  });
}
