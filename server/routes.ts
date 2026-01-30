import { Express } from "express";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express) {
  setupAuth(app);

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
