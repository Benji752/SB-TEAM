import { Express } from "express";
import { setupAuth } from "./auth";
import axios from "axios";
import { modelStats } from "@shared/schema";
import { db } from "./db";
import { desc, gte } from "drizzle-orm";

export async function registerRoutes(_httpServer: any, app: Express) {
  setupAuth(app);

  // Monitoring WildgirlShow - API Proxy only
  app.get("/api/monitor/wildgirl", async (req, res) => {
    try {
      const targetUrl = "https://stripchat.com/api/front/v2/models/username/WildgirlShow/cam";
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      try {
        const response = await axios.get(proxyUrl, { timeout: 8000 });
        if (response.data && response.data.contents) {
          const realData = JSON.parse(response.data.contents);
          if (realData.cam) {
            return res.json({
              isOnline: realData.cam.isLive || false,
              currentPrice: realData.cam.viewPrivatePrice || 60,
              stripScore: realData.model?.stripScore || 0,
              favorites: realData.model?.favoritesCount || 0,
            });
          }
        }
      } catch (e: any) {
        console.error("API Fetch failed:", e.message);
      }
      res.status(404).json({ error: "API data unavailable" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manual update - POST
  app.post("/api/model-stats", async (req, res) => {
    try {
      const { hourlyRevenue, subscribers, stripScore, favorites, isOnline } = req.body;
      
      const [newStat] = await db.insert(modelStats).values({
        isOnline: isOnline === 'true' || isOnline === true,
        currentPrice: 60,
        stripScore: Number(stripScore) || 0,
        favorites: Number(favorites) || 0,
        subscribers: Number(subscribers) || 0,
        hourlyRevenue: Number(hourlyRevenue) || 0,
      }).returning();

      res.json(newStat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get last recorded manual stats
  app.get("/api/model-stats/latest", async (req, res) => {
    try {
      const lastStatsArr = await db.select().from(modelStats)
        .orderBy(desc(modelStats.createdAt))
        .limit(1);
      res.json(lastStatsArr[0] || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // History for charts
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
