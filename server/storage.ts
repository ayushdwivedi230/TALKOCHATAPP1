// Storage interface and implementation - referenced from javascript_database blueprint
import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type MessageWithSender } from "../shared/schema";
import { db } from "./db";
import { eq, desc, or, and, isNull, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(excludeUserId?: number): Promise<User[]>;
  updateLastSeen(userId: number): Promise<void>;
  
  // Message operations
  getAllMessages(): Promise<MessageWithSender[]>;
  getConversation(userId1: number, userId2: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(excludeUserId?: number): Promise<User[]> {
    if (excludeUserId) {
      return await db.select().from(users).where(ne(users.id, excludeUserId));
    }
    return await db.select().from(users);
  }

  async updateLastSeen(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllMessages(): Promise<MessageWithSender[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        text: messages.text,
        timestamp: messages.timestamp,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(isNull(messages.recipientId))
      .orderBy(messages.timestamp);
    
    return result;
  }

  async getConversation(userId1: number, userId2: number): Promise<MessageWithSender[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        text: messages.text,
        timestamp: messages.timestamp,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(messages.timestamp);
    
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
