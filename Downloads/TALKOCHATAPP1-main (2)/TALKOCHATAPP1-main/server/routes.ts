// API routes and WebSocket server - referenced from javascript_websocket blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema, insertMessageSchema, type User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "talko-secret-key-change-in-production";
const SALT_ROUNDS = 10;

// WebSocket client interface
interface WSClient extends WebSocket {
  userId?: number;
  username?: string;
}

// Connected users map
const connectedUsers = new Map<number, WSClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
      
      // Create user
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Don't send password hash to client
      const { password, ...userWithoutPassword } = user;

      res.status(201).json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: error.message || 'Registration failed' 
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(data.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Don't send password hash to client
      const { password, ...userWithoutPassword } = user;

      res.json({ 
        user: userWithoutPassword, 
        token 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: error.message || 'Login failed' 
      });
    }
  });

  // Get all users
  app.get('/api/users', authenticateToken, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers(req.userId);
      
      // Remove password from user objects
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      }));
      
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to fetch users' 
      });
    }
  });

  // Get all group messages
  app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      
      // Remove password from sender objects
      const sanitizedMessages = messages.map(msg => ({
        ...msg,
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          createdAt: msg.sender.createdAt,
        }
      }));
      
      res.json(sanitizedMessages);
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to fetch messages' 
      });
    }
  });

  // Get conversation with a specific user
  app.get('/api/conversations/:userId', authenticateToken, async (req: any, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const messages = await storage.getConversation(req.userId, otherUserId);
      
      // Remove password from sender objects
      const sanitizedMessages = messages.map(msg => ({
        ...msg,
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          createdAt: msg.sender.createdAt,
        }
      }));
      
      res.json(sanitizedMessages);
    } catch (error: any) {
      console.error('Get conversation error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to fetch conversation' 
      });
    }
  });

  // Send message (group or direct)
  app.post('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      const data = insertMessageSchema.parse({
        senderId: req.userId,
        recipientId: req.body.recipientId || null,
        text: req.body.text,
      });
      
      const message = await storage.createMessage(data);
      
      // Get sender info for WebSocket message
      const sender = await storage.getUser(req.userId);
      
      const messageData = JSON.stringify({
        type: 'message',
        message: {
          ...message,
          sender: {
            id: sender!.id,
            username: sender!.username,
            createdAt: sender!.createdAt,
          }
        },
      });
      
      if (data.recipientId) {
        // Direct message - send only to sender and recipient
        const recipientClient = connectedUsers.get(data.recipientId);
        const senderClient = connectedUsers.get(req.userId);
        
        if (recipientClient && recipientClient.readyState === WebSocket.OPEN) {
          recipientClient.send(messageData);
        }
        
        if (senderClient && senderClient.readyState === WebSocket.OPEN) {
          senderClient.send(messageData);
        }
      } else {
        // Group message - broadcast to all connected clients
        connectedUsers.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageData);
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(400).json({ 
        message: error.message || 'Failed to send message' 
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup - referenced from javascript_websocket blueprint
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const broadcastOnlineUsers = () => {
    const onlineUsers = Array.from(connectedUsers.values())
      .filter(client => client.userId && client.username)
      .map(client => ({
        id: client.userId!,
        username: client.username!,
      }));

    const message = JSON.stringify({
      type: 'online_users',
      users: onlineUsers,
    });

    connectedUsers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (ws: WSClient) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && message.token) {
          // Verify JWT token
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET) as { userId: number };
            const user = await storage.getUser(decoded.userId);
            
            if (user) {
              ws.userId = user.id;
              ws.username = user.username;
              connectedUsers.set(user.id, ws);
              
              console.log(`User ${user.username} authenticated via WebSocket`);
              
              // Broadcast updated online users list
              broadcastOnlineUsers();
            } else {
              ws.close(1008, 'User not found');
            }
          } catch (error) {
            console.error('WebSocket auth error:', error);
            ws.close(1008, 'Invalid token');
          }
        }

          // Typing indicator events: forward to recipient only (real-time, no persistence)
          if (message.type === 'typing' || message.type === 'stop_typing') {
            const payload = JSON.stringify({
              type: message.type,
              fromUserId: ws.userId,
              toUserId: message.toUserId,
            });

            connectedUsers.forEach((client) => {
              if (
                client.readyState === WebSocket.OPEN &&
                client.userId === message.toUserId
              ) {
                client.send(payload);
              }
            });
          }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        connectedUsers.delete(ws.userId);
        console.log(`User ${ws.username} disconnected`);
        
        // Broadcast updated online users list
        broadcastOnlineUsers();
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
