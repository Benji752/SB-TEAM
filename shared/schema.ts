import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Mock User for local session
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  role: text("role", { enum: ["admin", "staff", "model"] }).default("model").notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  role: text("role", { enum: ["admin", "staff", "model"] }).default("model").notNull(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles);
export type Profile = typeof profiles.$inferSelect;
export type User = typeof users.$inferSelect;

// Models (The Talent)
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  instagramHandle: text("instagram_handle"),
  onlyFansHandle: text("onlyfans_handle"),
  status: text("status", { enum: ["active", "inactive", "pending"] }).default("active").notNull(),
  profileImage: text("profile_image"),
  managerId: integer("manager_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModelSchema = createInsertSchema(models).omit({ id: true, createdAt: true });
export type Model = typeof models.$inferSelect;

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  isDone: boolean("is_done").default(false).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  assignedTo: integer("assigned_to"),
  modelId: integer("model_id"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export type Task = typeof tasks.$inferSelect;

// Agency Stats
export const agencyStats = pgTable("agency_stats", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  revenue: integer("revenue").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  churnRate: integer("churn_rate").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AgencyStats = typeof agencyStats.$inferSelect;

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  source: text("source"),
  status: text("status", { enum: ["new", "contacted", "qualified", "rejected"] }).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id"), // Nullable for channel messages
  channelId: text("channel_id"), // New field for group chats
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driveAssets = pgTable("drive_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size"),
  type: text("type"),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driveFiles = pgTable("drive_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size"),
  type: text("type"),
  folderId: integer("folder_id"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("client_requests", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  serviceType: text("service_type").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull().default("pending_payment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  time: text("time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
