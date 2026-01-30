import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth tables to ensure they are included in migrations
export * from "./models/auth";

// Extended User Profile (linked to Auth User via ID, but for app-specific fields)
// We'll use the same 'users' table from auth model if possible, but Replit Auth blueprint 
// owns 'users'. The blueprint instructions say: "The users and sessions tables are mandatory - don't drop them".
// To add roles, we can either extend the table or add a separate 'profiles' table.
// Blueprint says: "When generating users table schema, always keep the default config for the id column".
// I will create a 'profiles' table to hold role and other specific data, linked by id (which is the auth sub).

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Linked to auth.users.id
  username: text("username").notNull().unique(),
  role: text("role", { enum: ["admin", "staff", "model"] }).default("model").notNull(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles);
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// Models (The Talent)
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  instagramHandle: text("instagram_handle"),
  onlyFansHandle: text("onlyfans_handle"),
  status: text("status", { enum: ["active", "inactive", "pending"] }).default("active").notNull(),
  profileImage: text("profile_image"),
  managerId: text("manager_id"), // Linked to profiles.id (staff/admin)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModelSchema = createInsertSchema(models).omit({ id: true, createdAt: true });
export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "completed"] }).default("todo").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  assignedTo: text("assigned_to"), // profile.id
  modelId: integer("model_id"), // Associated model
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Agency Stats (Revenue, etc.)
export const agencyStats = pgTable("agency_stats", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // e.g., "Jan 2024"
  revenue: integer("revenue").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  churnRate: integer("churn_rate").default(0), // percentage * 100
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AgencyStats = typeof agencyStats.$inferSelect;

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  assignedTasks: many(tasks),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  tasks: many(tasks),
  manager: one(profiles, {
    fields: [models.managerId],
    references: [profiles.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(profiles, {
    fields: [tasks.assignedTo],
    references: [profiles.id],
  }),
  model: one(models, {
    fields: [tasks.modelId],
    references: [models.id],
  }),
}));
