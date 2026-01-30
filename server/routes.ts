import { Express } from "express";
import { setupAuth } from "./auth";
import { supabase } from "./lib/supabase"; // Assuming this is where it should be or I'll use common pattern
import axios from "axios";
import { modelStats } from "@shared/schema";
import { db } from "./db";
import { desc, gte } from "drizzle-orm";

export async function registerRoutes(_httpServer: any, app: Express) {
  setupAuth(app);

  // Monitoring WildgirlShow
  app.get("/api/monitor/wildgirl", async (req, res) => {
    try {
      const response = await axios.get("https://stripchat.com/api/front/v2/models/username/WildgirlShow/cam", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const isOnline = response.data?.cam?.isLive || false;
      // Tentative de récupération du prix. Souvent dans cam.viewPrivatePrice ou cam.price
      const currentPrice = response.data?.cam?.viewPrivatePrice || 60; // Valeur par défaut si non trouvé

      await db.insert(modelStats).values({
        isOnline,
        currentPrice,
      });

      res.json({ success: true, isOnline, currentPrice });
    } catch (error: any) {
      console.error("Monitor error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/model-stats", async (req, res) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await db.select().from(modelStats)
      .where(gte(modelStats.createdAt, twentyFourHoursAgo))
      .orderBy(modelStats.createdAt);
    res.json(stats);
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    res.json([
      { month: "Jan", revenue: 4500, newSubscribers: 120, churnRate: 500 },
      { month: "Feb", revenue: 5200, newSubscribers: 150, churnRate: 450 },
    ]);
  });

  // Models
  app.get("/api/models", (req, res) => {
    res.json([
      { id: 1, name: "Alice V.", status: "active", instagramHandle: "@alice" },
      { id: 2, name: "Bella M.", status: "active", instagramHandle: "@bella" },
    ]);
  });

  // Tasks
  app.get("/api/tasks", (req, res) => {
    res.json([
      { id: 1, title: "Shoot Alice", status: "todo", priority: "high" },
      { id: 2, title: "Review contracts", status: "completed", priority: "medium" },
    ]);
  });
}
