import { z } from "zod";

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertMessageSchema = z.object({
  senderId: z.number(),
  recipientId: z.number().nullable().optional(),
  text: z.string().min(1, "Message text is required"),
});

export type User = {
  id: number;
  username: string;
  lastSeen?: string | null;
};

export type Message = {
  id: number;
  senderId: number;
  recipientId?: number | null;
  text: string;
  timestamp: string;
};

export type MessageWithSender = Message & { sender: User };
