import { db } from "./db";
import {
  profiles, models, tasks, agencyStats, orders,
  type Profile, type User,
  type Model,
  type Task, type InsertTask,
  type AgencyStats, type Order
} from "@shared/schema";
import { eq, desc, ne } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(id: string, updates: any): Promise<Profile>;
  
  // Models
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: any): Promise<Model>;
  updateModel(id: number, updates: any): Promise<Model>;
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
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, parseInt(id)));
    return profile;
  }

  async createProfile(profile: any): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: string, updates: any): Promise<Profile> {
    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, parseInt(id)))
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

  async createModel(model: any): Promise<Model> {
    const [newModel] = await db.insert(models).values(model).returning();
    return newModel;
  }

  async updateModel(id: number, updates: any): Promise<Model> {
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

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }
}

export const storage = new DatabaseStorage();
