// Storage interface and implementation - referenced from javascript_database blueprint
import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type MessageWithSender } from "@shared/schema";
import { eq, desc, or, and, isNull, ne } from "drizzle-orm";

// In production with DATABASE_URL, the db module is imported in server/routes.ts or elsewhere
// For local dev without DATABASE_URL, we use MockStorage (defined below)

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(excludeUserId?: number): Promise<User[]>;
  
  // Message operations
  getAllMessages(): Promise<MessageWithSender[]>;
  getConversation(userId1: number, userId2: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  constructor(private dbInstance: any) {}

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.dbInstance.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.dbInstance.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.dbInstance
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(excludeUserId?: number): Promise<User[]> {
    if (excludeUserId) {
      return await this.dbInstance.select().from(users).where(ne(users.id, excludeUserId));
    }
    return await this.dbInstance.select().from(users);
  }

  async getAllMessages(): Promise<MessageWithSender[]> {
    const result = await this.dbInstance
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
    const result = await this.dbInstance
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
    const [message] = await this.dbInstance
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

// In-memory mock storage for local development when DATABASE_URL is not set
class MockStorage implements IStorage {
  private users: Array<any> = [];
  private messages: Array<any> = [];
  private nextUserId = 1;
  private nextMessageId = 1;

  async getUser(id: number) {
    return this.users.find(u => u.id === id) as User | undefined;
  }

  async getUserByUsername(username: string) {
    return this.users.find(u => u.username === username) as User | undefined;
  }

  async createUser(insertUser: InsertUser) {
    const user = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
    } as any;
    this.users.push(user);
    return user as User;
  }

  async getAllUsers(excludeUserId?: number) {
    if (excludeUserId) {
      return this.users.filter(u => u.id !== excludeUserId) as User[];
    }
    return this.users as User[];
  }

  async getAllMessages() {
    const msgs = this.messages
      .filter(m => m.recipientId == null)
      .sort((a,b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime())
      .map(m => ({ ...m, sender: this.users.find(u => u.id === m.senderId) }));
    return msgs as MessageWithSender[];
  }

  async getConversation(userId1: number, userId2: number) {
    const msgs = this.messages
      .filter(m => (m.senderId === userId1 && m.recipientId === userId2) || (m.senderId === userId2 && m.recipientId === userId1))
      .sort((a,b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime())
      .map(m => ({ ...m, sender: this.users.find(u => u.id === m.senderId) }));
    return msgs as MessageWithSender[];
  }

  async createMessage(insertMessage: InsertMessage) {
    const message = {
      id: this.nextMessageId++,
      senderId: insertMessage.senderId,
      recipientId: insertMessage.recipientId ?? null,
      text: insertMessage.text,
      timestamp: new Date(),
    } as any;
    this.messages.push(message);
    return message as Message;
  }
}

export const storage = new MockStorage();
