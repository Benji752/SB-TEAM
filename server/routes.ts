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
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      // 1. Always get last recorded stats first as baseline
      const lastStatsArr = await db.select().from(modelStats)
        .orderBy(desc(modelStats.createdAt))
        .limit(1);
      
      const lastStats = lastStatsArr[0];

      let isOnline = lastStats?.isOnline || false;
      let currentPrice = lastStats?.currentPrice || 60;
      let stripScore = lastStats?.stripScore || 0;
      let favorites = lastStats?.favorites || 0;
      const subscribers = lastStats?.subscribers || 0;
      const hourlyRevenue = lastStats?.hourlyRevenue || 0;

      // 2. Silent Background Update
      try {
        const response = await axios.get(proxyUrl, { timeout: 8000 });
        if (response.data && response.data.contents) {
          const realData = JSON.parse(response.data.contents);
          if (realData.cam) {
            // ONLY update if we got real data
            isOnline = realData.cam.isLive || false;
            currentPrice = realData.cam.viewPrivatePrice || 60;
            stripScore = realData.model?.stripScore || stripScore;
            favorites = realData.model?.favoritesCount || favorites;
            
            // Success: persist to DB
            await db.insert(modelStats).values({
              isOnline,
              currentPrice,
              stripScore,
              favorites,
              subscribers,
              hourlyRevenue,
            });
          }
        }
      } catch (e: any) {
        console.error("AllOrigins Fetch failed, keeping existing data:", e.message);
        // On failure, we don't insert a new record with zeros, 
        // we just return the last known good record
      }

      // 3. Return latest data (either newly fetched or last known)
      const latestStats = await db.select().from(modelStats)
        .orderBy(desc(modelStats.createdAt))
        .limit(1);
        
      res.json(latestStats[0] || { 
        isOnline: false, 
        currentPrice: 60, 
        stripScore: 0, 
        favorites: 0, 
        subscribers: 0, 
        hourlyRevenue: 0 
      });
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
