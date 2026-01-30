import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth tables to ensure they are included in migrations
export * from "./models/auth";

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

// --- New Tables for Prospects, Messages, Drive ---

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  source: text("source"), // e.g., "Instagram", "Referral"
  status: text("status", { enum: ["new", "contacted", "qualified", "rejected"] }).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driveFiles = pgTable("drive_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size"),
  type: text("type"), // e.g., "image/png", "application/pdf"
  folderId: integer("folder_id"),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
