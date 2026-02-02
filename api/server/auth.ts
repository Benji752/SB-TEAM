import { Express } from "express";
import session from "express-session";

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: "demo-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

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
