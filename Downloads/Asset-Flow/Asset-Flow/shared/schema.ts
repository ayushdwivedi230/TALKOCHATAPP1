
import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  completedLevel: integer("completed_level").default(0),
  reachedFinale: boolean("reached_finale").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ 
  id: true, 
  startedAt: true,
  completedAt: true 
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
