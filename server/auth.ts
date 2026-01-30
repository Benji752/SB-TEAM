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
    const user = { 
      id: 1, 
      username: `demo_${role}`, 
      role,
      firstName: role.charAt(0).toUpperCase() + role.slice(1),
      lastName: "Demo"
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
