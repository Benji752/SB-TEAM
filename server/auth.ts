import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

// Mock admin user for MOCK_AUTH mode
const MOCK_ADMIN_USER = {
  id: 1,
  username: "Benjamin",
  email: "admin@sb-digital.fr",
  role: "admin",
  firstName: "Benjamin",
  lastName: "Admin",
  tenantId: "sb-tenant"
};

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
    // Inject mock user
    if (!(req.session as any).user) {
      (req.session as any).user = MOCK_ADMIN_USER;
    }
    
    // Simulate req.user (used by Passport)
    req.user = (req.session as any).user || MOCK_ADMIN_USER;
    
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
      req.user = MOCK_ADMIN_USER;
    }
    return true;
  }
  
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

// Get current user (with mock fallback)
export function getCurrentUser(req: Request): typeof MOCK_ADMIN_USER {
  if (isMockAuthEnabled()) {
    return (req.user as any) || MOCK_ADMIN_USER;
  }
  return (req.user as any) || (req.session as any)?.user || MOCK_ADMIN_USER;
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
    
    // Assign correct userId based on role for presence tracking
    const userId = role === "model" ? 2 : 1;
    const firstName = role === "model" ? "Laura" : "Benjamin";
    
    const user = { 
      id: userId, 
      username: firstName, 
      email: role === "model" ? "laura@sb-digital.fr" : "admin@sb-digital.fr",
      role,
      firstName,
      lastName: role === "model" ? "Model" : "Admin",
      tenantId: "sb-tenant"
    };
    (req.session as any).user = user;
    req.user = user;
    res.json(user);
  });

  app.get("/api/user", (req, res) => {
    // In mock auth mode, always return a valid user
    if (isMockAuthEnabled()) {
      return res.json(getCurrentUser(req));
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
