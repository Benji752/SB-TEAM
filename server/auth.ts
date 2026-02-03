import { Express, Request } from "express";
import session from "express-session";

const MOCK_ADMIN_USER = {
  id: 1,
  username: "Benjamin",
  role: "admin",
  firstName: "Benjamin",
  lastName: "Admin"
};


export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "demo-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: isProduction },
    })
  );

  // En production (Vercel), injecter automatiquement le mock user et simuler Passport
  if (isProduction) {
    app.use((req: Request, _res, next) => {
      // Injecter le mock user dans la session
      if (!(req.session as any).user) {
        (req.session as any).user = MOCK_ADMIN_USER;
      }
      
      // Simuler req.user (utilisé par Passport)
      req.user = (req.session as any).user || MOCK_ADMIN_USER;
      
      // Simuler req.isAuthenticated() (utilisé par Passport)
      req.isAuthenticated = () => true;
      
      next();
    });
  }

  app.post("/api/login-demo", (req, res) => {
    const { role } = req.body;
    
    // Assign correct userId based on role for presence tracking
    // admin/staff → Nico (userId: 1)
    // model → Laura (userId: 2)
    const userId = role === "model" ? 2 : 1;
    const firstName = role === "model" ? "Laura" : "Nico";
    
    const user = { 
      id: userId, 
      username: firstName, 
      role,
      firstName,
      lastName: role === "model" ? "Model" : "Admin"
    };
    (req.session as any).user = user;
    res.json(user);
  });

  app.get("/api/user", (req, res) => {
    // En production, toujours retourner le mock user
    if (process.env.NODE_ENV === 'production') {
      return res.json((req.session as any).user || MOCK_ADMIN_USER);
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
