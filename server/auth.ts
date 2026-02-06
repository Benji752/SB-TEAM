import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { db } from "./db";
import { profiles } from "@shared/schema";
import { eq } from "drizzle-orm";

// Mock admin user for MOCK_AUTH mode
// Uses UUID for display but also provides numeric ID for gamification tables
function getMockAdminUser() {
  return {
    id: process.env.MOCK_USER_ID || "mock-admin-uuid-001",
    numericId: parseInt(process.env.MOCK_USER_NUMERIC_ID || "1", 10),
    username: "Benjamin",
    email: "admin@sb-digital.fr",
    role: "admin",
    firstName: "Benjamin",
    lastName: "Admin",
    tenantId: "sb-tenant"
  };
}

function getMockModelUser() {
  return {
    id: process.env.MOCK_MODEL_ID || "mock-model-uuid-002",
    numericId: parseInt(process.env.MOCK_MODEL_NUMERIC_ID || "2", 10),
    username: "Laura",
    email: "laura@sb-digital.fr",
    role: "model",
    firstName: "Laura",
    lastName: "Model",
    tenantId: "sb-tenant"
  };
}

// Check if MOCK_AUTH mode is enabled
export function isMockAuthEnabled(): boolean {
  return process.env.MOCK_AUTH === 'true' || process.env.NODE_ENV === 'production';
}

// Get mock tenant (bypasses any database lookup)
export function getMockTenant(): string {
  return "sb-tenant";
}

// Middleware to inject mock authentication
export function mockAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (isMockAuthEnabled()) {
    const mockUser = getMockAdminUser();
    
    // Inject mock user
    if (!(req.session as any).user) {
      (req.session as any).user = mockUser;
    }
    
    // Simulate req.user (used by Passport)
    req.user = (req.session as any).user || mockUser;
    
    // Simulate req.isAuthenticated() (used by Passport)
    (req as any).isAuthenticated = () => true;
  }
  next();
}

// Safe wrapper for routes that require authentication
export function requireAuth(req: Request, res: Response): boolean {
  if (isMockAuthEnabled()) {
    // Always authenticated in mock mode
    if (!req.user) {
      req.user = getMockAdminUser();
    }
    return true;
  }
  
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

// Type for user with string or number id
export interface AuthUser {
  id: string | number;
  numericId?: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
}

// Get current user (with mock fallback)
export function getCurrentUser(req: Request): AuthUser {
  if (isMockAuthEnabled()) {
    return (req.user as any) || getMockAdminUser();
  }
  return (req.user as any) || (req.session as any)?.user || getMockAdminUser();
}

// Helper to get user ID as string (for UUID compatibility)
export function getUserIdAsString(req: Request): string {
  const user = getCurrentUser(req);
  return String(user.id);
}

// Helper to get numeric user ID (for gamification tables that use integer)
export function getUserNumericId(req: Request): number {
  const user = getCurrentUser(req);
  // If user has numericId, use it; otherwise try to parse id or fallback to 1
  if ((user as any).numericId) {
    return (user as any).numericId;
  }
  const parsed = parseInt(String(user.id), 10);
  return isNaN(parsed) ? 1 : parsed;
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "demo-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      },
    })
  );

  // Apply mock auth middleware globally when enabled
  app.use(mockAuthMiddleware);

  app.post("/api/login-demo", (req, res) => {
    const { role } = req.body;
    
    const user = role === "model" ? getMockModelUser() : getMockAdminUser();
    (req.session as any).user = user;
    req.user = user;
    res.json(user);
  });

  app.get("/api/user", async (req, res) => {
    // In mock auth mode, always return a valid user enriched with profile data
    if (isMockAuthEnabled()) {
      const user = getCurrentUser(req);
      const numericId = (user as any).numericId || 1;

      // Fetch avatar_url from profiles table
      try {
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, numericId));
        if (profile) {
          return res.json({
            ...user,
            avatarUrl: profile.avatarUrl,
            avatar_url: profile.avatarUrl,
          });
        }
      } catch (e) {
        // DB not ready yet, return user without avatar
      }

      return res.json(user);
    }

    if ((req.session as any).user) {
      res.json((req.session as any).user);
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ success: true });
    });
  });
}
