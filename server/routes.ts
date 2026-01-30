import { Express } from "express";
import { setupAuth } from "./auth";
import axios from "axios";
import { modelStats } from "@shared/schema";
import { db } from "./db";
import { desc, gte } from "drizzle-orm";

export async function registerRoutes(_httpServer: any, app: Express) {
  setupAuth(app);

  // Monitoring WildgirlShow
  app.get("/api/monitor/wildgirl", async (req, res) => {
    try {
      const targetUrl = "https://stripchat.com/api/front/v2/models/username/WildgirlShow/cam";
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      let isOnline = false;
      let currentPrice = 60;
      let stripScore = 0;
      let favorites = 0;

      try {
        const response = await axios.get(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });

        isOnline = response.data?.cam?.isLive || false;
        currentPrice = response.data?.cam?.viewPrivatePrice || 60;
        stripScore = response.data?.model?.stripScore || 0;
        favorites = response.data?.model?.favoritesCount || 0;
      } catch (e) {
        console.error("API Fetch failed, using last known data");
      }

      // Get last recorded stats for fallback/private data
      const lastStats = await db.select().from(modelStats)
        .orderBy(desc(modelStats.createdAt))
        .limit(1);

      const subscribers = lastStats[0]?.subscribers || 0;
      const hourlyRevenue = lastStats[0]?.hourlyRevenue || 0;
      
      // If API failed or returned zeros, use last known values for score/favorites/online
      if (stripScore === 0) stripScore = lastStats[0]?.stripScore || 0;
      if (favorites === 0) favorites = lastStats[0]?.favorites || 0;
      if (!isOnline && lastStats[0]) isOnline = lastStats[0].isOnline;

      const [newStat] = await db.insert(modelStats).values({
        isOnline,
        currentPrice,
        stripScore,
        favorites,
        subscribers,
        hourlyRevenue,
      }).returning();

      res.json(newStat);
    } catch (error: any) {
      console.error("Monitor error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/model-stats", async (req, res) => {
    try {
      const { hourlyRevenue, subscribers, stripScore, favorites, isOnline } = req.body;
      
      const targetUrl = "https://stripchat.com/api/front/v2/models/username/WildgirlShow/cam";
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      let apiIsOnline = isOnline === 'true' || isOnline === true;
      let apiPrice = 60;
      let apiScore = Number(stripScore) || 0;
      let apiFavs = Number(favorites) || 0;

      try {
        const response = await axios.get(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });

        if (response.data?.cam) {
           apiIsOnline = response.data.cam.isLive;
           apiPrice = response.data.cam.viewPrivatePrice || 60;
           apiScore = response.data.model?.stripScore || apiScore;
           apiFavs = response.data.model?.favoritesCount || apiFavs;
        }
      } catch (e) {
        console.error("Manual update API fetch failed");
      }

      const [newStat] = await db.insert(modelStats).values({
        isOnline: apiIsOnline,
        currentPrice: apiPrice,
        stripScore: apiScore,
        favorites: apiFavs,
        subscribers: Number(subscribers),
        hourlyRevenue: Number(hourlyRevenue),
      }).returning();

      res.json(newStat);
    } catch (error: any) {
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
