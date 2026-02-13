
import { z } from 'zod';
import { insertGameSessionSchema, gameSessions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  sessions: {
    create: {
      method: 'POST' as const,
      path: '/api/sessions' as const,
      input: z.object({}),
      responses: {
        201: z.custom<typeof gameSessions.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/sessions/:id' as const,
      input: z.object({
        completedLevel: z.number().optional(),
        reachedFinale: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof gameSessions.$inferSelect>(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
