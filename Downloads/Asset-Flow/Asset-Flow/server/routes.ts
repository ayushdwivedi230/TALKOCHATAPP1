
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const session = await storage.createSession({});
      res.status(201).json(session);
    } catch (err) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch(api.sessions.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = api.sessions.update.input.parse(req.body);
      const session = await storage.updateSession(id, updates);
      res.json(session);
    } catch (err) {
      res.status(400).json({ message: "Failed to update session" });
    }
  });

  // Cupid chat removed per request: Task 4 replaced by a static puzzle.

  return httpServer;
}
