import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { loginSchema, insertUserSchema } from "../shared/schema";
import type { User } from "../shared/schema";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Track connected WebSocket clients
  const clients = new Map<number, Set<any>>();

  // Auth Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        user: { id: user.id, username: user.username, lastSeen: user.lastSeen },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Validate input
      const validation = loginSchema.safeParse({ username, password });
      if (!validation.success) {
        const message = validation.error.issues[0]?.message || "Validation failed";
        return res.status(400).json({ message });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Update last_seen on successful login
      await storage.updateLastSeen(user.id);

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Fetch updated user with latest lastSeen
      const updatedUser = await storage.getUser(user.id);

      res.json({
        user: { id: updatedUser!.id, username: updatedUser!.username, lastSeen: updatedUser!.lastSeen },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get all users
  app.get("/api/users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers(req.userId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get current user
  app.get("/api/user", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Message Routes
  app.get("/api/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { text, recipientId } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Message text cannot be empty" });
      }

      const message = await storage.createMessage({
        senderId: req.userId!,
        recipientId: recipientId || null,
        text,
      });

      // Update sender's last_seen after message send
      await storage.updateLastSeen(req.userId!);

      // Broadcast message to connected clients
      const messageWithSender = {
        ...message,
        sender: await storage.getUser(req.userId!),
      };

      broadcastMessage("message", messageWithSender);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // WebSocket server for real-time messaging
  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    // Get userId from query or token
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    let userId: number | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        userId = decoded.userId;

        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId)!.add(ws);

        // Broadcast online status
        broadcastMessage("userOnline", { userId });

        ws.on("message", async (data) => {
          try {
            const message = JSON.parse(data.toString());

            if (message.type === "message") {
              const savedMessage = await storage.createMessage({
                senderId: userId!,
                recipientId: message.recipientId || null,
                text: message.text,
              });

              // Update sender's last_seen on message
              await storage.updateLastSeen(userId!);

              const messageWithSender = {
                ...savedMessage,
                sender: await storage.getUser(userId!),
              };

              broadcastMessage("message", messageWithSender);

            }

            // Typing indicators (real-time only, no DB)
            else if (message.type === "typing" || message.type === "stop_typing") {
              const recipientId = message.recipientId || message.toUserId;
              if (recipientId && clients.has(recipientId)) {
                const payloadType = message.type === "typing" ? "typing" : "stop_typing";
                const recipientSet = clients.get(recipientId)!;
                const payload = JSON.stringify({ type: payloadType, fromUserId: userId });
                recipientSet.forEach((clientWs) => {
                  try {
                    if (clientWs.readyState === 1) clientWs.send(payload);
                  } catch (err) {
                    console.error('Failed to send typing event', err);
                  }
                });
              }
            }
          } catch (error) {
            console.error("WebSocket message error:", error);
          }
        });

        ws.on("close", () => {
          const clientSet = clients.get(userId!);
          if (clientSet) {
            clientSet.delete(ws);
            if (clientSet.size === 0) {
              clients.delete(userId!);
              broadcastMessage("userOffline", { userId });
            }
          }
        });
      } catch (error) {
        console.error("WebSocket auth error:", error);
        ws.close();
      }
    } else {
      ws.close();
    }
  });

  function broadcastMessage(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  return httpServer;
}
