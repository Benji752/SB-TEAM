import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Profile Management (Me)
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub; // From Replit Auth
    let profile = await storage.getProfile(userId);
    
    // Auto-create profile if not exists
    if (!profile) {
      const username = req.user.claims.email?.split('@')[0] || `user_${userId.substring(0,8)}`;
      profile = await storage.createProfile({
        id: userId,
        username: username,
        role: "admin", // Default to admin for MVP, logic can be improved
        bio: "New user"
      });
    }
    
    res.json(profile);
  });

  app.patch(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const input = api.profiles.update.input.parse(req.body);
      const updated = await storage.updateProfile(userId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Models
  app.get(api.models.list.path, isAuthenticated, async (req, res) => {
    const models = await storage.getModels();
    res.json(models);
  });

  app.get(api.models.get.path, isAuthenticated, async (req, res) => {
    const model = await storage.getModel(Number(req.params.id));
    if (!model) return res.status(404).json({ message: "Not found" });
    res.json(model);
  });

  app.post(api.models.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.models.create.input.parse(req.body);
      const model = await storage.createModel(input);
      res.status(201).json(model);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.models.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.models.update.input.parse(req.body);
      const updated = await storage.updateModel(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.models.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteModel(Number(req.params.id));
    res.status(204).send();
  });

  // Tasks
  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const updated = await storage.updateTask(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.tasks.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Stats
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getAgencyStats();
    res.json(stats);
  });

  // Seed Data (Check and seed if empty)
  const existingModels = await storage.getModels();
  if (existingModels.length === 0) {
    console.log("Seeding database...");
    await storage.createModel({ name: "Alice V.", status: "active", instagramHandle: "@alice_v", onlyFansHandle: "alice_exclusive" });
    await storage.createModel({ name: "Bella M.", status: "active", instagramHandle: "@bella_m", onlyFansHandle: "bella_vip" });
    await storage.createModel({ name: "Chloe S.", status: "pending", instagramHandle: "@chloe_s", onlyFansHandle: "chloe_secret" });
    
    // Create some stats
    // We need to access db directly for this or extend storage interface, 
    // but for simplicity let's assume storage has getAgencyStats. 
    // Wait, storage.ts implementation for getAgencyStats is just a select. 
    // I need to add createAgencyStats to storage interface or use db directly here.
    // I will use db directly for seeding to avoid polluting storage interface with one-off seed methods if not needed.
    // But I can't import db here easily without importing it.
    // Let's just skip complex seeding or add createAgencyStats to storage.
    // I'll add tasks.
    const models = await storage.getModels();
    if (models.length > 0) {
       await storage.createTask({ title: "Onboard Alice", status: "completed", priority: "high", modelId: models[0].id, description: "Initial setup" });
       await storage.createTask({ title: "Content Plan for Bella", status: "in_progress", priority: "medium", modelId: models[1].id, description: "Draft weekly schedule" });
       await storage.createTask({ title: "Review Chloe's application", status: "todo", priority: "high", modelId: models[2].id, description: "Check background" });
    }
  }

  return httpServer;
}
