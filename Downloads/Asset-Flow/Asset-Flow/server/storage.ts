
import { db } from "./db";
import {
  gameSessions,
  type GameSession,
  type InsertGameSession,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createSession(session: InsertGameSession): Promise<GameSession>;
  updateSession(id: number, updates: Partial<GameSession>): Promise<GameSession>;
}

export class DatabaseStorage implements IStorage {
  async createSession(session: InsertGameSession): Promise<GameSession> {
    const [newSession] = await db.insert(gameSessions).values(session).returning();
    return newSession;
  }

  async updateSession(id: number, updates: Partial<GameSession>): Promise<GameSession> {
    const [updated] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
