import { Express } from "express";
import { setupAuth } from "./auth";
import axios from "axios";
import { modelStats, authLogs, users, profiles, tasks, orders, models, agencyStats, aiChatHistory, gamificationProfiles, hunterLeads, workSessions, xpActivityLog, insertHunterLeadSchema, insertWorkSessionSchema } from "@shared/schema";
import { db } from "./db";
import { desc, gte, eq, ne, sql, and, isNull } from "drizzle-orm";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";

// ========== GAMIFICATION HELPERS ==========
// SAISON MENSUELLE - Objectif Niveau 300 (Formule linéaire: 100 XP = 1 niveau)
const XP_PER_LEAD = 150;           // Déclaration de leads approuvés
const XP_PER_PRESENCE = 10;        // Toutes les 10 minutes de présence
const XP_PER_ORDER_CREATE = 75;    // Création de commande
const XP_PER_ORDER_PAID = 75;      // Commande payée (total: 150 XP)
const XP_LOGIN_BONUS = 50;         // Bonus première connexion du jour
const NIGHT_OWL_BONUS = 50;

// Nouvelle formule linéaire: Level = Floor(XP / 100) + 1
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function isNightOwlTime(date?: Date): boolean {
  const checkDate = date || new Date();
  const hour = checkDate.getHours();
  return hour >= 0 && hour < 6;
}

async function awardXP(userId: number, xpAmount: number, actionType: string, description: string) {
  const profile = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);
  
  if (!profile.length) return null;
  
  const newXpTotal = (profile[0].xpTotal || 0) + xpAmount;
  const newLevel = calculateLevel(newXpTotal);
  const oldLevel = profile[0].level;
  
  await db.update(gamificationProfiles)
    .set({ 
      xpTotal: newXpTotal, 
      level: newLevel,
      updatedAt: new Date()
    })
    .where(eq(gamificationProfiles.userId, userId));
  
  await db.insert(xpActivityLog).values({
    userId,
    actionType,
    xpGained: xpAmount,
    description
  });
  
  return { newXpTotal, newLevel, leveledUp: newLevel > oldLevel };
}

export async function registerRoutes(_httpServer: any, app: Express) {
  // ========== DEV ROUTE - NO AUTH MIDDLEWARE ==========
  // This route bypasses all auth for admin season reset
  app.post("/api/dev/reset-season", async (req, res) => {
    try {
      const { userId, username } = req.body;
      
      console.log('[RESET] Tentative par:', userId, username);

      // Check by ID first
      let isAdmin = false;
      if (userId) {
        const result = await db.execute(
          sql`SELECT role FROM profiles WHERE id = ${String(userId)} LIMIT 1`
        );
        if (result.rows?.length && result.rows[0].role === 'admin') {
          isAdmin = true;
        }
      }

      // Backup: If username is Benjamin, allow
      if (!isAdmin && username) {
        const result = await db.execute(
          sql`SELECT role FROM profiles WHERE username = ${username} LIMIT 1`
        );
        if (result.rows?.length && result.rows[0].role === 'admin') {
          isAdmin = true;
        }
        // Special case: Benjamin always passes
        if (username === 'Benjamin') {
          isAdmin = true;
        }
      }

      if (!isAdmin) {
        return res.status(403).json({ error: "Interdit. Tu n'es pas admin." });
      }

      // Reset gamification_profiles
      await db.update(gamificationProfiles)
        .set({ xpTotal: 0, level: 1, currentStreak: 0 })
        .where(sql`1=1`);

      // Delete all activity logs
      await db.delete(xpActivityLog).where(sql`1=1`);
      
      // Delete all hunter leads
      await db.delete(hunterLeads).where(sql`1=1`);
      
      // Delete all work sessions
      await db.delete(workSessions).where(sql`1=1`);

      // Purge orphan/ghost profiles
      await db.execute(sql`
        DELETE FROM gamification_profiles 
        WHERE username IS NULL OR username = '' OR username = 'Utilisateur Inconnu'
      `);

      console.log("[RESET] Season reset by:", username || userId);
      return res.json({ success: true, message: `Saison Reset par ${username || 'Admin'}!` });
    } catch (error: any) {
      console.error("[RESET] Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

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
      // Get creator from session (more reliable than trusting req.body)
      const sessionUserId = (req.session as any)?.userId;
      const rawCreatorId = sessionUserId || req.body.createdBy;
      const creatorId = rawCreatorId ? (typeof rawCreatorId === 'number' ? rawCreatorId : parseInt(String(rawCreatorId), 10)) : null;
      
      // Create order with createdBy from session if available
      const orderData = { ...req.body, createdBy: creatorId || null };
      const order = await storage.createOrder(orderData);
      
      // Award XP for creating an order
      if (creatorId && !isNaN(creatorId)) {
        // Get or create gamification profile
        let [profile] = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, creatorId));
        
        if (!profile) {
          [profile] = await db.insert(gamificationProfiles).values({
            userId: creatorId,
            xpTotal: 0,
            level: 1,
            currentStreak: 0,
            roleMultiplier: 1.0,
            badges: [],
          }).returning();
        }
        
        // Add XP for creating order
        const xpGained = XP_PER_ORDER_CREATE;
        const newXp = profile.xpTotal + xpGained;
        const newLevel = calculateLevel(newXp);
        
        await db.update(gamificationProfiles)
          .set({ xpTotal: newXp, level: newLevel })
          .where(eq(gamificationProfiles.userId, creatorId));
        
        // Log the activity
        await db.insert(xpActivityLog).values({
          userId: creatorId,
          actionType: "order_created",
          xpGained,
          description: `a initié une commande pour ${order.clientName}`,
        });
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const orderId = parseInt(req.params.id);
      
      // Get the current order to check for status change and creator
      const [currentOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      // Award +100 XP bonus when order becomes 'paid' (and wasn't already paid)
      if (status === 'paid' && currentOrder && currentOrder.status !== 'paid' && currentOrder.createdBy) {
        const creatorId = currentOrder.createdBy;
        
        // Get gamification profile
        let [profile] = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, creatorId));
        
        if (!profile) {
          [profile] = await db.insert(gamificationProfiles).values({
            userId: creatorId,
            xpTotal: 0,
            level: 1,
            currentStreak: 0,
            roleMultiplier: 1.0,
            badges: [],
          }).returning();
        }
        
        // Add XP bonus for paid order
        const xpGained = XP_PER_ORDER_PAID;
        const newXp = profile.xpTotal + xpGained;
        const newLevel = calculateLevel(newXp);
        
        await db.update(gamificationProfiles)
          .set({ xpTotal: newXp, level: newLevel })
          .where(eq(gamificationProfiles.userId, creatorId));
        
        // Log the activity
        await db.insert(xpActivityLog).values({
          userId: creatorId,
          actionType: "order_paid",
          xpGained,
          description: `Commande ${currentOrder.clientName} payée ! Jackpot +${XP_PER_ORDER_PAID} XP`,
        });
      }
      
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

  // ========== GAMIFICATION ROUTES - SB HUNTER LEAGUE ==========

  // Get leaderboard data - team members only
  app.get("/api/gamification/leaderboard", async (req, res) => {
    try {
      // Known team members (userId -> {name, role})
      const TEAM_MEMBERS: Record<number, { name: string; role: string }> = {
        1: { name: "Nico", role: "staff" },
        2: { name: "Laura", role: "model" },
      };
      
      // Get all gamification profiles
      const allProfiles = await db.select()
        .from(gamificationProfiles)
        .orderBy(desc(gamificationProfiles.xpTotal));
      
      const now = Date.now();
      
      // Filter to team members only and add TIMEAGO data
      const leaderboard = allProfiles
        .filter(p => TEAM_MEMBERS[p.userId] !== undefined)
        .map(p => {
          const teamMember = TEAM_MEMBERS[p.userId];
          const lastActive = p.lastActiveAt ? new Date(p.lastActiveAt).getTime() : 0;
          const secondsSinceLastPing = p.lastActiveAt ? Math.floor((now - lastActive) / 1000) : null;
          
          return {
            ...p,
            username: teamMember.name,
            role: teamMember.role,
            secondsSinceLastPing  // TIMEAGO: Frontend judges < 300 = online
          };
        });
      
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== NEW SIMPLIFIED GAMIFICATION SYSTEM ==========

  // Get leaderboard from SQL View (Source of Truth)
  app.get("/api/gamification/leaderboard-view", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM gamification_leaderboard_view`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Leaderboard view error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Simplified ping - just update last_active_at and username
  app.post("/api/gamification/ping", async (req, res) => {
    try {
      const schema = z.object({ 
        userId: z.number(),
        username: z.string().optional()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { userId, username } = result.data;
      
      const now = new Date();
      
      // Check if profile exists
      const existing = await db.select().from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);
      
      if (existing.length) {
        // Update existing profile
        const updateData: any = { lastActiveAt: now, updatedAt: now };
        if (username) updateData.username = username;
        
        await db.update(gamificationProfiles)
          .set(updateData)
          .where(eq(gamificationProfiles.userId, userId));
      } else {
        // Create new profile
        await db.insert(gamificationProfiles).values({
          userId,
          username: username || null,
          xpTotal: 0,
          level: 1,
          currentStreak: 0,
          roleMultiplier: 2.0,
          lastActiveAt: now
        });
      }
      
      // Award XP for presence (10 XP per ping, configured for 10-minute intervals)
      await awardXP(userId, XP_PER_PRESENCE, "presence", `Présence active +${XP_PER_PRESENCE} XP`);
      
      res.json({ success: true, timestamp: now.toISOString() });
    } catch (error: any) {
      console.error("Ping error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's gamification profile
  app.get("/api/gamification/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await db.select().from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);
      
      if (!profile.length) {
        // First, try to get role from profiles table (persisted role)
        const userProfile = await db.select().from(profiles)
          .where(eq(profiles.id, userId))
          .limit(1);
        
        let userRole = userProfile.length ? userProfile[0].role?.toLowerCase() : null;
        
        // Fallback to session role if no profile found
        if (!userRole) {
          const session = req.session as any;
          userRole = session?.user?.role?.toLowerCase();
        }
        
        // Staff/Admin get 2.0x multiplier, Models get 1.0x
        const roleMultiplier = (userRole === 'admin' || userRole === 'staff') ? 2.0 : 1.0;
        
        const newProfile = await db.insert(gamificationProfiles).values({
          userId,
          xpTotal: 0,
          level: 1,
          currentStreak: 0,
          roleMultiplier
        }).returning();
        return res.json(newProfile[0]);
      }
      
      res.json(profile[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get XP activity log with usernames
  app.get("/api/gamification/activity", async (req, res) => {
    try {
      // Get activities with user info via SQL JOIN
      const activitiesResult = await db.execute(sql`
        SELECT 
          xal.id,
          xal.user_id as "userId",
          xal.action_type as "actionType",
          xal.xp_gained as "xpGained",
          xal.description,
          xal.created_at as "createdAt",
          COALESCE(gp.username, p.username, 'Utilisateur Inconnu') as username
        FROM xp_activity_log xal
        LEFT JOIN gamification_profiles gp ON xal.user_id = gp.user_id
        LEFT JOIN profiles p ON CAST(xal.user_id AS TEXT) = p.id
        ORDER BY xal.created_at DESC
        LIMIT 20
      `);
      
      res.json(activitiesResult.rows);
    } catch (error: any) {
      console.error("Activity error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== WORK SESSION (POINTEUSE) ==========

  // Start shift
  app.post("/api/gamification/shift/start", async (req, res) => {
    try {
      const schema = z.object({ userId: z.number() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error });
      }
      const { userId } = result.data;
      
      // Check if there's already an active session
      const activeSession = await db.select().from(workSessions)
        .where(and(
          eq(workSessions.userId, userId),
          eq(workSessions.isActive, true)
        ))
        .limit(1);
      
      if (activeSession.length) {
        return res.status(400).json({ error: "Shift already active" });
      }
      
      const session = await db.insert(workSessions).values({
        userId,
        startTime: new Date(),
        isActive: true
      }).returning();
      
      res.json(session[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop shift
  app.post("/api/gamification/shift/stop", async (req, res) => {
    try {
      const schema = z.object({ userId: z.number() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error });
      }
      const { userId } = result.data;
      
      const activeSession = await db.select().from(workSessions)
        .where(and(
          eq(workSessions.userId, userId),
          eq(workSessions.isActive, true)
        ))
        .limit(1);
      
      if (!activeSession.length) {
        return res.status(400).json({ error: "No active shift" });
      }
      
      const session = activeSession[0];
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 60000);
      
      // Calculate XP: 10 XP per 30 minutes
      const profile = await db.select().from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);
      
      const multiplier = profile.length ? profile[0].roleMultiplier : 1.0;
      let pointsEarned = Math.floor(durationMinutes / 10) * XP_PER_PRESENCE * multiplier;
      
      // Night owl bonus - based on shift START time, not end time
      const shiftStartTime = new Date(session.startTime);
      if (isNightOwlTime(shiftStartTime)) {
        pointsEarned += NIGHT_OWL_BONUS;
      }
      
      // Update session
      await db.update(workSessions)
        .set({
          endTime,
          durationMinutes,
          pointsEarned: Math.floor(pointsEarned),
          isActive: false
        })
        .where(eq(workSessions.id, session.id));
      
      // Award XP
      if (pointsEarned > 0) {
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        await awardXP(userId, Math.floor(pointsEarned), "work_session", `Session de travail: ${hours}h${mins}m`);
      }
      
      res.json({ 
        durationMinutes, 
        pointsEarned: Math.floor(pointsEarned),
        nightOwlBonus: isNightOwlTime()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get active session
  app.get("/api/gamification/shift/active/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activeSession = await db.select().from(workSessions)
        .where(and(
          eq(workSessions.userId, userId),
          eq(workSessions.isActive, true)
        ))
        .limit(1);
      
      res.json(activeSession.length ? activeSession[0] : null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== AUTO-TRACKING HEARTBEAT ==========
  
  // Heartbeat - auto-track presence (+10 XP every 10 minutes) + Daily login bonus
  app.post("/api/gamification/heartbeat", async (req, res) => {
    try {
      const schema = z.object({ 
        userId: z.number(),
        username: z.string().optional()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { userId, username } = result.data;
      
      // Get user's gamification profile (create if doesn't exist)
      let profile = await db.select().from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);
      
      if (!profile.length) {
        // Get role from session (profiles table uses text IDs)
        const session = req.session as any;
        const userRole = session?.user?.role?.toLowerCase() || 'staff';
        
        const roleMultiplier = (userRole === 'admin' || userRole === 'staff') ? 2.0 : 1.0;
        
        const newProfile = await db.insert(gamificationProfiles).values({
          userId,
          username: username || null,
          xpTotal: 0,
          level: 1,
          currentStreak: 0,
          roleMultiplier
        }).returning();
        profile = newProfile;
      }
      
      // Update lastActiveAt timestamp and always update username if provided
      const now = new Date();
      const updateData: any = { lastActiveAt: now, updatedAt: now };
      if (username) {
        updateData.username = username;
      }
      await db.update(gamificationProfiles)
        .set(updateData)
        .where(eq(gamificationProfiles.userId, userId));
      
      // Check for daily login bonus (+50 XP first connection of the day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLoginCheck = await db.select().from(xpActivityLog)
        .where(and(
          eq(xpActivityLog.userId, userId),
          eq(xpActivityLog.actionType, "daily_login"),
          gte(xpActivityLog.createdAt, today)
        ))
        .limit(1);
      
      let loginBonusAwarded = false;
      if (!todayLoginCheck.length) {
        // Award daily login bonus
        await awardXP(userId, XP_LOGIN_BONUS, "daily_login", `Bonus connexion quotidienne +${XP_LOGIN_BONUS} XP`);
        loginBonusAwarded = true;
      }
      
      // Award XP for presence (10 XP per 10-minute heartbeat)
      const xpGained = XP_PER_PRESENCE;
      const multiplier = profile[0].roleMultiplier || 1.0;
      const finalXp = Math.floor(xpGained * multiplier);
      
      await awardXP(userId, finalXp, "presence", `Présence active +${finalXp} XP`);
      
      // Track today's active time using a dedicated auto-tracking session
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      // Find today's auto-tracking session (pointsEarned = -1 is our marker for auto sessions)
      const todayAutoSession = await db.select().from(workSessions)
        .where(and(
          eq(workSessions.userId, userId),
          gte(workSessions.startTime, todayDate),
          eq(workSessions.isActive, false),
          sql`${workSessions.pointsEarned} = -1`
        ))
        .limit(1);
      
      // Create or update auto-tracking session
      if (!todayAutoSession.length) {
        await db.insert(workSessions).values({
          userId,
          startTime: new Date(),
          endTime: new Date(),
          durationMinutes: 5,
          pointsEarned: -1, // Marker for auto-tracking session
          isActive: false
        });
      } else {
        await db.update(workSessions)
          .set({
            durationMinutes: sql`${workSessions.durationMinutes} + 5`,
            endTime: new Date()
          })
          .where(eq(workSessions.id, todayAutoSession[0].id));
      }
      
      res.json({ xpGained: finalXp, message: "Heartbeat recorded" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== PRESENCE PING (Simple lastActiveAt update) ==========
  app.post("/api/user/ping", async (req, res) => {
    try {
      const schema = z.object({ userId: z.number() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { userId } = result.data;
      console.log(`✅ Ping reçu pour user ${userId}`);
      
      // Update lastActiveAt in gamification_profiles
      const updated = await db.update(gamificationProfiles)
        .set({ lastActiveAt: new Date() })
        .where(eq(gamificationProfiles.userId, userId))
        .returning();
      
      if (!updated.length) {
        // Create profile if doesn't exist
        const session = req.session as any;
        const userRole = session?.user?.role?.toLowerCase() || 'staff';
        const roleMultiplier = (userRole === 'admin' || userRole === 'staff') ? 2.0 : 1.0;
        
        await db.insert(gamificationProfiles).values({
          userId,
          xpTotal: 0,
          level: 1,
          currentStreak: 0,
          roleMultiplier,
          lastActiveAt: new Date()
        });
      }
      
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark user as offline (called on logout)
  app.post("/api/user/offline", async (req, res) => {
    try {
      const schema = z.object({ userId: z.number() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { userId } = result.data;
      
      // Set lastActiveAt to a date in the past (20 minutes ago) to ensure offline status
      const offlineDate = new Date(Date.now() - 20 * 60 * 1000);
      
      await db.update(gamificationProfiles)
        .set({ lastActiveAt: offlineDate })
        .where(eq(gamificationProfiles.userId, userId));
      
      res.json({ success: true, status: 'offline' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user presence status
  app.get("/api/user/presence/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const profile = await db.select({ lastActiveAt: gamificationProfiles.lastActiveAt })
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);
      
      if (!profile.length) {
        return res.json({ userId, lastActiveAt: null, isOnline: false });
      }
      
      const lastActiveAt = profile[0].lastActiveAt;
      const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes tolerance
      const isOnline = lastActiveAt 
        ? (Date.now() - new Date(lastActiveAt).getTime()) < ONLINE_THRESHOLD_MS 
        : false;
      
      res.json({ userId, lastActiveAt, isOnline });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all users presence status (bulk)
  app.get("/api/user/presence-all", async (req, res) => {
    try {
      const allProfiles = await db.select({
        userId: gamificationProfiles.userId,
        lastActiveAt: gamificationProfiles.lastActiveAt
      }).from(gamificationProfiles);
      
      // TIMEAGO APPROACH: Return seconds since last ping (no timezone issues!)
      const presenceMap = allProfiles.reduce((acc, profile) => {
        let secondsSinceLastPing: number | null = null;
        
        if (profile.lastActiveAt) {
          // Calculate difference in seconds using server time
          const lastActiveTime = new Date(profile.lastActiveAt).getTime();
          const now = Date.now();
          secondsSinceLastPing = Math.floor((now - lastActiveTime) / 1000);
        }
        
        acc[profile.userId] = {
          lastActiveAt: profile.lastActiveAt,
          secondsSinceLastPing  // Frontend will judge: < 300 = online
        };
        return acc;
      }, {} as Record<number, { lastActiveAt: Date | null; secondsSinceLastPing: number | null }>);
      
      console.log('📊 Presence map:', JSON.stringify(presenceMap));
      res.json(presenceMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's active time for a user (auto-tracking only)
  app.get("/api/gamification/today-time/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Only get auto-tracking sessions (pointsEarned = -1 is our marker)
      const sessions = await db.select().from(workSessions)
        .where(and(
          eq(workSessions.userId, userId),
          gte(workSessions.startTime, today),
          sql`${workSessions.pointsEarned} = -1`
        ));
      
      const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      
      res.json({ 
        userId,
        todayMinutes: totalMinutes,
        formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== HUNTER LEADS ==========

  // Declare a new lead
  app.post("/api/gamification/leads", async (req, res) => {
    try {
      const schema = insertHunterLeadSchema.extend({
        clientUsername: z.string().min(1, "Client username required"),
        platform: z.string().min(1, "Platform required"),
        finderId: z.number()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error });
      }
      const { clientUsername, platform, finderId } = result.data;
      
      const lead = await db.insert(hunterLeads).values({
        clientUsername,
        platform,
        finderId,
        status: "pending"
      }).returning();
      
      res.json(lead[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all pending leads (Admin)
  app.get("/api/gamification/leads/pending", async (req, res) => {
    try {
      const pendingLeads = await db.select()
        .from(hunterLeads)
        .where(eq(hunterLeads.status, "pending"))
        .orderBy(desc(hunterLeads.createdAt));
      
      res.json(pendingLeads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate/Reject a lead (Admin)
  app.patch("/api/gamification/leads/:id/validate", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const schema = z.object({ approved: z.boolean() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error });
      }
      const { approved } = result.data;
      
      const lead = await db.select().from(hunterLeads)
        .where(eq(hunterLeads.id, leadId))
        .limit(1);
      
      if (!lead.length) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      if (approved) {
        // Get finder's multiplier
        const profile = await db.select().from(gamificationProfiles)
          .where(eq(gamificationProfiles.userId, lead[0].finderId))
          .limit(1);
        
        const multiplier = profile.length ? profile[0].roleMultiplier : 1.0;
        let xpAwarded = XP_PER_LEAD * multiplier;
        
        // Night owl bonus - based on lead CREATION time, not validation time
        const leadCreatedAt = lead[0].createdAt ? new Date(lead[0].createdAt) : new Date();
        if (isNightOwlTime(leadCreatedAt)) {
          xpAwarded += NIGHT_OWL_BONUS;
        }
        
        // Update lead
        await db.update(hunterLeads)
          .set({
            status: "approved",
            xpAwarded: Math.floor(xpAwarded),
            validatedAt: new Date()
          })
          .where(eq(hunterLeads.id, leadId));
        
        // Award XP
        await awardXP(
          lead[0].finderId, 
          Math.floor(xpAwarded), 
          "lead_approved", 
          `Lead validé: @${lead[0].clientUsername} (${lead[0].platform})`
        );
        
        res.json({ status: "approved", xpAwarded: Math.floor(xpAwarded) });
      } else {
        await db.update(hunterLeads)
          .set({ status: "rejected", validatedAt: new Date() })
          .where(eq(hunterLeads.id, leadId));
        
        res.json({ status: "rejected", xpAwarded: 0 });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's leads
  app.get("/api/gamification/leads/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const leads = await db.select()
        .from(hunterLeads)
        .where(eq(hunterLeads.finderId, userId))
        .orderBy(desc(hunterLeads.createdAt));
      
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ADMIN ONLY: Reset Season - Clear all XP and reset levels
  app.post("/api/gamification/reset", async (req, res) => {
    try {
      const session = req.session as any;
      const sessionUser = session?.user;
      
      // Get userId from session (demo login stores id in session.user.id)
      let userId: string | null = null;
      
      // Method 1: From demo session
      if (sessionUser?.id) {
        userId = String(sessionUser.id);
      }
      
      // Method 2: From req.user (Replit Auth)
      if (!userId && (req as any).user?.id) {
        userId = String((req as any).user.id);
      }
      
      console.log(`[ADMIN] Reset attempt - userId: ${userId}, sessionUser:`, sessionUser);
      
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié. Veuillez vous reconnecter." });
      }
      
      // MANDATORY DB CHECK: Query profiles table directly for role verification
      const profileResult = await db.execute(sql`
        SELECT role FROM profiles WHERE id = ${userId}
      `);
      
      const userRole = (profileResult.rows?.[0] as any)?.role?.toLowerCase() || null;
      console.log(`[ADMIN] DB role check - userId: ${userId}, dbRole: ${userRole}`);
      
      // Security check: Only admin can reset
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          error: "Accès refusé. Seuls les administrateurs peuvent réinitialiser la saison.",
          debug: { userId, userRole }
        });
      }
      
      // Step 1: Clean up orphaned gamification profiles (users not in profiles table)
      const cleanupResult = await db.execute(sql`
        DELETE FROM gamification_profiles 
        WHERE user_id NOT IN (SELECT CAST(id AS INTEGER) FROM profiles WHERE id ~ '^[0-9]+$')
        AND (username IS NULL OR username = '')
      `);
      console.log(`[ADMIN] Cleaned up orphaned profiles`);
      
      // Step 2: Reset all remaining gamification profiles: XP to 0, level to 1
      await db.update(gamificationProfiles)
        .set({
          xpTotal: 0,
          level: 1,
          currentStreak: 0
        });
      
      // Step 3: Clear XP activity log
      await db.delete(xpActivityLog);
      
      // Step 4: Clear hunter leads
      await db.delete(hunterLeads);
      
      // Step 5: Clear work sessions
      await db.delete(workSessions);
      
      console.log(`[ADMIN] Season reset completed by admin (userId: ${userId})`);
      
      res.json({ 
        success: true, 
        message: "Saison réinitialisée avec succès. Tous les XP, niveaux, historiques et profils orphelins ont été nettoyés." 
      });
    } catch (error: any) {
      console.error("[ADMIN] Reset season error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
