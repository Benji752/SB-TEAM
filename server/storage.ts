import { db } from "./db";
import {
  profiles, models, tasks, agencyStats, orders,
  type Profile, type InsertProfile,
  type Model, type InsertModel,
  type Task, type InsertTask,
  type AgencyStats, type Order, type InsertOrder
} from "@shared/schema";
import { eq, desc, ne } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile>;
  
  // Models
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, updates: Partial<InsertModel>): Promise<Model>;
  deleteModel(id: number): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getRecentTasks(limit: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Stats
  getAgencyStats(): Promise<AgencyStats[]>;

  // Orders
  getRecentOrders(limit: number): Promise<Order[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, id))
      .returning();
    return updated;
  }

  // Models
  async getModels(): Promise<Model[]> {
    return await db.select().from(models);
  }

  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  }

  async createModel(model: InsertModel): Promise<Model> {
    const [newModel] = await db.insert(models).values(model).returning();
    return newModel;
  }

  async updateModel(id: number, updates: Partial<InsertModel>): Promise<Model> {
    const [updated] = await db
      .update(models)
      .set(updates)
      .where(eq(models.id, id))
      .returning();
    return updated;
  }

  async deleteModel(id: number): Promise<void> {
    await db.delete(models).where(eq(models.id, id));
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getRecentTasks(limit: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(ne(tasks.isDone, true))
      .orderBy(desc(tasks.createdAt))
      .limit(limit);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Stats
  async getAgencyStats(): Promise<AgencyStats[]> {
    return await db.select().from(agencyStats);
  }

  // Orders
  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
