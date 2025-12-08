// Storage interface and implementation - referenced from javascript_database blueprint
import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type MessageWithSender } from "@shared/schema";
import { eq, desc, or, and, isNull, ne } from "drizzle-orm";
import pkg from 'pg';
const { Pool } = pkg;

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

// `storage` will be exported at the bottom as a hybrid implementation.

// Hybrid storage: if a DATABASE_URL is present, attempt DB operations first.
// On Postgres 'relation does not exist' (42P01) error, attempt to create tables and retry.
async function ensureTables(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "recipientId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    await pool.end();
  }
}

function createHybridStorage(): IStorage {
  const mock = new MockStorage();

  // If no DATABASE_URL, return mock immediately
  if (!process.env.DATABASE_URL) return mock;

  // Lazy import of drizzle DB instance if available
  let dbInstance: any = undefined;
  try {
    // attempt to import the compiled db module (if present)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    dbInstance = undefined;
  } catch (e) {
    dbInstance = undefined;
  }

  const dbStorage = dbInstance ? new DatabaseStorage(dbInstance) : null;

  // helper to run an operation with retry on missing tables
  async function withFallback<T>(op: () => Promise<T>): Promise<T> {
    try {
      if (dbStorage) return await op();
      return await op();
    } catch (err: any) {
      // If Postgres relation missing, attempt to create tables then retry once
      if (err && (err.code === '42P01' || (typeof err.message === 'string' && err.message.includes('relation "users" does not exist')))) {
        try {
          await ensureTables();
          return await op();
        } catch (err2) {
          // final fallback to mock storage
          return (op as any).mockFallback();
        }
      }
      throw err;
    }
  }

  // Build the hybrid object mapping to either DB or mock.
  const hybrid: any = {
    getUser: async (id: number) => {
      if (dbStorage) return withFallback(() => dbStorage.getUser(id)).catch(async () => mock.getUser(id));
      return mock.getUser(id);
    },
    getUserByUsername: async (username: string) => {
      if (dbStorage) return withFallback(() => dbStorage.getUserByUsername(username)).catch(async () => mock.getUserByUsername(username));
      return mock.getUserByUsername(username);
    },
    createUser: async (u: InsertUser) => {
      if (dbStorage) return withFallback(() => dbStorage.createUser(u)).catch(async () => mock.createUser(u));
      return mock.createUser(u);
    },
    getAllUsers: async (excludeUserId?: number) => {
      if (dbStorage) return withFallback(() => dbStorage.getAllUsers(excludeUserId)).catch(async () => mock.getAllUsers(excludeUserId));
      return mock.getAllUsers(excludeUserId);
    },
    getAllMessages: async () => {
      if (dbStorage) return withFallback(() => dbStorage.getAllMessages()).catch(async () => mock.getAllMessages());
      return mock.getAllMessages();
    },
    getConversation: async (a: number, b: number) => {
      if (dbStorage) return withFallback(() => dbStorage.getConversation(a, b)).catch(async () => mock.getConversation(a, b));
      return mock.getConversation(a, b);
    },
    createMessage: async (m: InsertMessage) => {
      if (dbStorage) return withFallback(() => dbStorage.createMessage(m)).catch(async () => mock.createMessage(m));
      return mock.createMessage(m);
    }
  } as IStorage;

  return hybrid;
}

export const storage = createHybridStorage();
