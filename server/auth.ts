import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { db } from "./db";
import { profiles } from "@shared/schema";
import { eq } from "drizzle-orm";

// ========== MOCK USERS ==========

const MOCK_USERS: Record<number, any> = {
  1: {
    id: "mock-admin-uuid-001",
    numericId: 1,
    username: "Benjamin",
    email: "admin@sb-digital.fr",
    role: "admin",
    firstName: "Benjamin",
    lastName: "Admin",
    tenantId: "sb-tenant"
  },
  2: {
    id: "mock-model-uuid-002",
    numericId: 2,
    username: "Laura",
    email: "laura@sb-digital.fr",
    role: "model",
    firstName: "Laura",
    lastName: "Model",
    tenantId: "sb-tenant"
  },
  3: {
    id: "mock-staff-uuid-003",
    numericId: 3,
    username: "Nico",
    email: "nico@sb-digital.fr",
    role: "staff",
    firstName: "Nico",
    lastName: "Staff",
    tenantId: "sb-tenant"
  }
};

// ========== HELPERS ==========

function parseCookieUserId(req: Request): number | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/sb-user-id=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getMockUserById(id: number) {
  return MOCK_USERS[id] || null;
}

export function isMockAuthEnabled(): boolean {
  return process.env.MOCK_AUTH === 'true' || process.env.NODE_ENV === 'production';
}

export function getMockTenant(): string {
  return "sb-tenant";
}

// ========== MIDDLEWARE ==========

export function mockAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (isMockAuthEnabled()) {
    const cookieUserId = parseCookieUserId(req);
    const mockUser = cookieUserId ? getMockUserById(cookieUserId) : null;

    if (mockUser) {
      req.user = mockUser;
      (req as any).isAuthenticated = () => true;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response): boolean {
  if (isMockAuthEnabled()) {
    if (req.user) return true;
    // No user cookie set
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

// ========== TYPES ==========

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

export function getCurrentUser(req: Request): AuthUser {
  if (isMockAuthEnabled()) {
    if (req.user) return req.user as any;
    // Fallback: read cookie
    const cookieUserId = parseCookieUserId(req);
    if (cookieUserId) {
      const user = getMockUserById(cookieUserId);
      if (user) return user;
    }
    return MOCK_USERS[1]; // Ultimate fallback
  }
  return (req.user as any) || (req.session as any)?.user || MOCK_USERS[1];
}

export function getUserIdAsString(req: Request): string {
  const user = getCurrentUser(req);
  return String(user.id);
}

export function getUserNumericId(req: Request): number {
  const user = getCurrentUser(req);
  if ((user as any).numericId) {
    return (user as any).numericId;
  }
  const parsed = parseInt(String(user.id), 10);
  return isNaN(parsed) ? 1 : parsed;
}

// ========== ROUTES ==========

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "demo-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Allow cookies on HTTP too (Vercel handles HTTPS)
        sameSite: 'lax'
      },
    })
  );

  // Apply mock auth middleware globally
  app.use(mockAuthMiddleware);

  // Login: set cookie with selected user ID
  app.post("/api/login-demo", (_req, res) => {
    const { userId } = _req.body;
    const numId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);

    const user = getMockUserById(numId);
    if (!user) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Set persistent cookie (30 days)
    res.cookie('sb-user-id', String(numId), {
      httpOnly: false, // Accessible from JS for client-side checks
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });

    res.json(user);
  });

  // Get current user (enriched with profile avatar)
  app.get("/api/user", async (req, res) => {
    if (isMockAuthEnabled()) {
      const cookieUserId = parseCookieUserId(req);

      if (!cookieUserId) {
        return res.status(401).json({ message: "Not logged in" });
      }

      const user = getMockUserById(cookieUserId);
      if (!user) {
        return res.status(401).json({ message: "Not logged in" });
      }

      // Enrich with avatar from profiles table
      try {
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.numericId));
        if (profile) {
          return res.json({
            ...user,
            avatarUrl: profile.avatarUrl,
            avatar_url: profile.avatarUrl,
          });
        }
      } catch (e) {
        // DB not ready
      }

      return res.json(user);
    }

    if ((req.session as any).user) {
      res.json((req.session as any).user);
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  });

  // Get list of available users (for login page)
  app.get("/api/users/available", (_req, res) => {
    const users = Object.values(MOCK_USERS).map(u => ({
      numericId: u.numericId,
      username: u.username,
      role: u.role,
      email: u.email,
    }));
    res.json(users);
  });

  // Logout: clear cookie
  app.post("/api/logout", (_req, res) => {
    res.cookie('sb-user-id', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
    res.json({ success: true });
  });
}
