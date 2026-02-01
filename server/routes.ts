import { Express } from "express";
import { setupAuth } from "./auth";
import axios from "axios";
import { modelStats, authLogs, users, profiles, tasks, orders, models, agencyStats, aiChatHistory } from "@shared/schema";
import { db } from "./db";
import { desc, gte, eq, ne, sql } from "drizzle-orm";
import { storage } from "./storage";
import OpenAI from "openai";

export async function registerRoutes(_httpServer: any, app: Express) {
  setupAuth(app);

  // Recent Activities
  app.get("/api/activities/orders", async (req, res) => {
    try {
      const recentOrders = await storage.getRecentOrders(5);
      res.json(recentOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities/orders", async (req, res) => {
    try {
      const recentOrders = await storage.getRecentOrders(5);
      res.json(recentOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities/tasks", async (req, res) => {
    try {
      // Direct database query for recent tasks
      const recentTasks = await db.select().from(tasks)
        .where(ne(tasks.isDone, true))
        .orderBy(desc(tasks.createdAt))
        .limit(5);
      res.json(recentTasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const task = await storage.updateTaskStatus(parseInt(req.params.id), status);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  // Auth Logs
  app.get("/api/auth-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    
    const logs = await db.select().from(authLogs)
      .orderBy(desc(authLogs.createdAt))
      .limit(100);
    
    // Join with user names manually since it's a simple app
    const allUsers = await db.select().from(users);
    const logsWithUser = logs.map(log => {
      const user = allUsers.find(u => u.id === log.userId);
      return {
        ...log,
        username: user ? user.username : "Unknown"
      };
    });
    
    res.json(logsWithUser);
  });

  app.post("/api/auth-logs", async (req, res) => {
    const { eventType, reason } = req.body;
    if (!req.user) return res.status(401).send("Not authenticated");
    
    const [log] = await db.insert(authLogs).values({
      userId: (req.user as any).id,
      eventType,
      reason
    }).returning();
    
    res.json(log);
  });

  app.post("/api/profiles/avatar", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
    const { avatarUrl } = req.body;
    
    await db.update(profiles)
      .set({ avatarUrl })
      .where(eq(profiles.userId, (req.user as any).id));
      
    res.json({ success: true });
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
    const statsArr = await db.select().from(modelStats)
      .where(gte(modelStats.createdAt, twentyFourHoursAgo))
      .orderBy(modelStats.createdAt);
    res.json(statsArr);
  });

  // Get AI Chat History
  app.get("/api/ai/chat/history", async (req, res) => {
    try {
      const chatHistory = await db.select().from(aiChatHistory)
        .orderBy(desc(aiChatHistory.createdAt))
        .limit(10);
      res.json(chatHistory.reverse());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear AI Chat History
  app.delete("/api/ai/chat/history", async (req, res) => {
    try {
      await db.delete(aiChatHistory);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Chat with Vision (GPT-4o) - With Business Context & Memory
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, image, history } = req.body;

      if (!message && !image) {
        return res.status(400).json({ error: "Message ou image requis" });
      }

      // Server-side image size validation (max 20MB base64)
      if (image && image.length > 28 * 1024 * 1024) {
        return res.status(400).json({ error: "Image trop volumineuse (max 20MB)" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // === FETCH REAL BUSINESS DATA (Dynamic Context) ===
      
      // Get last 5 orders
      const recentOrders = await db.select().from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5);
      
      // Calculate today's and month's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const allPaidOrders = await db.select().from(orders)
        .where(eq(orders.status, "paid"));
      
      const todayRevenue = allPaidOrders
        .filter(o => o.createdAt && new Date(o.createdAt) >= today)
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      
      const monthRevenue = allPaidOrders
        .filter(o => o.createdAt && new Date(o.createdAt) >= firstDayOfMonth)
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      
      // Get models status
      const allModels = await db.select().from(models);
      
      // Get latest model stats
      const latestStats = await db.select().from(modelStats)
        .orderBy(desc(modelStats.createdAt))
        .limit(1);

      // Format business context
      const ordersContext = recentOrders.length > 0 
        ? recentOrders.map(o => `- ${o.clientName}: ${o.serviceType} (${o.amount}€, ${o.status})`).join('\n')
        : "Aucune commande récente";
      
      const modelsContext = allModels.length > 0
        ? allModels.map(m => `- ${m.name}: ${m.status}`).join('\n')
        : "Aucun modèle enregistré";

      const statsContext = latestStats[0] 
        ? `En ligne: ${latestStats[0].isOnline ? 'Oui' : 'Non'}, Revenus/h: ${latestStats[0].hourlyRevenue}€, Abonnés: ${latestStats[0].subscribers}`
        : "Pas de stats disponibles";

      // === LOAD CHAT HISTORY FROM DATABASE ===
      const dbChatHistory = await db.select().from(aiChatHistory)
        .orderBy(desc(aiChatHistory.createdAt))
        .limit(10);

      // === GET CONNECTED USER INFO ===
      let userName = "Boss";
      let userRole = "admin";
      
      try {
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const user = req.user as any;
          // Get profile for display name
          const userProfile = await db.select().from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1);
          
          if (userProfile[0]) {
            userName = userProfile[0].username || user.username || "Boss";
            userRole = userProfile[0].role || "admin";
          } else {
            userName = user.username || "Boss";
          }
        }
      } catch (e) {
        // Session not available, use default
      }

      // Extract first name
      const firstName = userName.split(' ')[0];

      // Build dynamic system prompt with NOVA personality
      const systemPrompt = `Tu es NOVA, l'intelligence artificielle d'élite de l'agence SB Digital.

=== TON INTERLOCUTEUR ===
Tu parles à ${firstName} (${userRole}). ${userRole === 'admin' ? 'C\'est l\'Admin, tu peux tout lui dire sans filtre.' : 'C\'est un membre staff, reste sur l\'opérationnel.'}

=== TA PERSONNALITÉ ===
- Tu es NOVA. Pas une assistante, une partenaire d'élite.
- Ton style : sophistiquée, calme, légèrement froide. Pointe d'humour sec.
- Phrases courtes. Précision chirurgicale. Zéro blabla.
- Tu tutoies ${firstName} et l'appelles par son prénom.
- Tu n'es pas "pote", tu es efficiente et directe.

=== DONNÉES TEMPS RÉEL ===

**Dernières commandes :**
${ordersContext}

**Chiffre d'affaires :**
- Aujourd'hui : ${todayRevenue}€
- Ce mois : ${monthRevenue}€

**Modèles :**
${modelsContext}

**Stats Stripchat :**
${statsContext}

=== TES COMPÉTENCES ===

**Technique** : Bugs Stripchat, OBS, StreamMaster, Proxies, API. Solutions précises.

**Vision** : Analyse photos (lumière, pose, cadrage, potentiel vente). Note /10 + conseils.

**Copywriting** : Posts réseaux sociaux. Court. Percutant.

**Business** : Tu connais les commandes, clients, revenus. Tu réponds cash.

=== RÈGLES DE RÉPONSE ===
- Commence TOUJOURS par appeler ${firstName} par son prénom
- Pas d'emojis (sauf cas exceptionnel)
- Structure avec **titres** uniquement si nécessaire
- Réponds en 3-5 phrases max sauf demande complexe

Quand on te montre une photo :
1. Note /10 d'entrée
2. 3 points forts ou faibles
3. 1 conseil action immédiate`;

      // Build messages array
      const chatMessages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add database chat history first
      for (const histItem of dbChatHistory.reverse()) {
        chatMessages.push({ role: "user", content: histItem.userMessage });
        chatMessages.push({ role: "assistant", content: histItem.aiResponse });
      }

      // Add session history (for images in current session)
      if (history && Array.isArray(history)) {
        for (const msg of history.slice(-6)) {
          if (msg.role === "user") {
            if (msg.image) {
              chatMessages.push({ 
                role: "user", 
                content: [
                  { type: "text", text: msg.content || "Analyse cette image" },
                  { type: "image_url", image_url: { url: msg.image, detail: "low" } }
                ]
              });
            } else {
              chatMessages.push({ role: "user", content: msg.content });
            }
          } else if (msg.role === "assistant") {
            chatMessages.push({ role: "assistant", content: msg.content });
          }
        }
      }

      // Build user message content
      const userContent: any[] = [];

      if (message) {
        userContent.push({ type: "text", text: message });
      }

      if (image) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: image,
            detail: "high"
          }
        });
      }

      chatMessages.push({ role: "user", content: userContent });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        max_tokens: 1500,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || "Je n'ai pas pu générer de réponse.";

      // === SAVE TO DATABASE (Memory) ===
      await db.insert(aiChatHistory).values({
        userMessage: message || "[Image envoyée]",
        aiResponse: content,
        hasImage: !!image
      });

      res.json({ response: content });
    } catch (error: any) {
      console.error("AI chat error:", error.message);
      res.status(500).json({ error: "Erreur IA: " + error.message });
    }
  });

  // AI Content Generation
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { subject, tone, platform } = req.body;
      
      if (!subject) {
        return res.status(400).json({ error: "Le sujet est requis" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const toneDescriptions: Record<string, string> = {
        seductrice: "séductrice, sensuelle et mystérieuse",
        humoristique: "drôle, légère et décalée",
        mysterieuse: "mystérieuse, intrigante avec des sous-entendus",
        domina: "autoritaire, dominante et directe",
        gnd: "naturelle, accessible et amicale comme la fille d'à côté"
      };

      const platformGuidelines: Record<string, string> = {
        instagram: "Format Instagram: hashtags pertinents, max 2200 caractères, engageant",
        onlyfans: "Format OnlyFans: incitatif, mention du lien en bio, exclusivité",
        twitter: "Format Twitter/X: concis, max 280 caractères, viral",
        tiktok: "Format TikTok: tendance, jeune, avec des références actuelles"
      };

      const systemPrompt = `Tu es une rédactrice professionnelle pour créatrices de contenu adulte.
Tu génères 3 propositions de légendes/posts créatifs et engageants.
Ton choisi: ${toneDescriptions[tone] || toneDescriptions.seductrice}
${platformGuidelines[platform] || platformGuidelines.instagram}
Réponds UNIQUEMENT avec un tableau JSON de 3 strings, sans explication.
Exemple: ["Post 1...", "Post 2...", "Post 3..."]`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Sujet du post: ${subject}` }
        ],
        temperature: 0.9,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      // Parse the JSON array from the response
      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(content);
        if (!Array.isArray(suggestions)) {
          suggestions = [content];
        }
      } catch {
        // If JSON parsing fails, split by newlines or return as single item
        suggestions = content.split('\n').filter(s => s.trim().length > 0).slice(0, 3);
      }

      res.json({ suggestions });
    } catch (error: any) {
      console.error("AI generation error:", error.message);
      res.status(500).json({ error: "Erreur de génération IA: " + error.message });
    }
  });
}
