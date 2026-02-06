import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });

/**
 * Run a single SQL statement safely - if it fails, log and continue.
 */
async function safeQuery(client: pg.PoolClient, label: string, sqlText: string) {
  try {
    await client.query(sqlText);
  } catch (error: any) {
    console.warn(`[DB] ${label} skipped: ${error.message}`);
  }
}

/**
 * Auto-initialize missing database tables and views.
 * Each statement runs independently so one failure doesn't block the rest.
 */
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log("[DB] Starting database initialization...");

    // Core tables
    await safeQuery(client, "users", `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'model' CHECK (role IN ('admin', 'model'))
      )
    `);

    await safeQuery(client, "auth_logs", `
      CREATE TABLE IF NOT EXISTS auth_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "profiles", `
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT,
        role TEXT DEFAULT 'model',
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add missing columns to profiles if it already exists with different schema
    await safeQuery(client, "profiles+user_id", `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER`);
    await safeQuery(client, "profiles+username", `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT`);
    await safeQuery(client, "profiles+role", `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'model'`);
    await safeQuery(client, "profiles+bio", `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT`);
    await safeQuery(client, "profiles+avatar_url", `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`);

    await safeQuery(client, "models", `
      CREATE TABLE IF NOT EXISTS models (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        instagram_handle TEXT,
        onlyfans_handle TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        profile_image TEXT,
        manager_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "tasks", `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        is_done BOOLEAN NOT NULL DEFAULT FALSE,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        assigned_to INTEGER,
        model_id INTEGER,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "agency_stats", `
      CREATE TABLE IF NOT EXISTS agency_stats (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        revenue INTEGER DEFAULT 0,
        new_subscribers INTEGER DEFAULT 0,
        churn_rate INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "prospects", `
      CREATE TABLE IF NOT EXISTS prospects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "messages", `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        channel_id TEXT,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "drive_assets", `
      CREATE TABLE IF NOT EXISTS drive_assets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        type TEXT,
        owner_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "drive_files", `
      CREATE TABLE IF NOT EXISTS drive_files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        type TEXT,
        folder_id INTEGER,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "client_requests", `
      CREATE TABLE IF NOT EXISTS client_requests (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_payment',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "orders", `
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        service_type TEXT NOT NULL DEFAULT 'Custom',
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "model_stats", `
      CREATE TABLE IF NOT EXISTS model_stats (
        id SERIAL PRIMARY KEY,
        is_online BOOLEAN NOT NULL DEFAULT FALSE,
        current_price INTEGER NOT NULL DEFAULT 60,
        strip_score INTEGER DEFAULT 0,
        favorites INTEGER DEFAULT 0,
        subscribers INTEGER DEFAULT 0,
        hourly_revenue DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "tickets", `
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
        status TEXT NOT NULL DEFAULT 'pending',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "resources", `
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "events", `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        time TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "ai_chat_history", `
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id SERIAL PRIMARY KEY,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        has_image BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "group_messages", `
      CREATE TABLE IF NOT EXISTS group_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        sender_username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Gamification tables
    await safeQuery(client, "gamification_profiles", `
      CREATE TABLE IF NOT EXISTS gamification_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        username TEXT,
        xp_total INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        current_streak INTEGER NOT NULL DEFAULT 0,
        role_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        badges TEXT[] DEFAULT '{}',
        last_active_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add missing columns to gamification_profiles if it exists with different schema
    await safeQuery(client, "gamification_profiles+id", `ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS id SERIAL`);
    await safeQuery(client, "gamification_profiles+username", `ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS username TEXT`);
    await safeQuery(client, "gamification_profiles+badges", `ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}'`);
    await safeQuery(client, "gamification_profiles+last_active_at", `ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP`);
    await safeQuery(client, "gamification_profiles+updated_at", `ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    // Drop NOT NULL on username (it may have been created with NOT NULL but we need to allow null)
    await safeQuery(client, "gamification_profiles~username_nullable", `ALTER TABLE gamification_profiles ALTER COLUMN username DROP NOT NULL`);

    await safeQuery(client, "hunter_leads", `
      CREATE TABLE IF NOT EXISTS hunter_leads (
        id SERIAL PRIMARY KEY,
        client_username TEXT NOT NULL,
        platform TEXT NOT NULL,
        finder_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        xp_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        validated_at TIMESTAMP
      )
    `);

    await safeQuery(client, "work_sessions", `
      CREATE TABLE IF NOT EXISTS work_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await safeQuery(client, "xp_activity_log", `
      CREATE TABLE IF NOT EXISTS xp_activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        xp_gained INTEGER NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Leaderboard view (depends on gamification_profiles)
    await safeQuery(client, "gamification_leaderboard_view", `
      CREATE OR REPLACE VIEW gamification_leaderboard_view AS
      SELECT
        gp.id,
        gp.user_id,
        gp.username,
        gp.xp_total,
        gp.level,
        gp.current_streak,
        gp.role_multiplier,
        gp.badges,
        gp.last_active_at,
        gp.created_at,
        gp.updated_at,
        EXTRACT(EPOCH FROM (NOW() - gp.last_active_at))::INTEGER AS seconds_since_active,
        CASE
          WHEN gp.last_active_at IS NULL THEN FALSE
          WHEN EXTRACT(EPOCH FROM (NOW() - gp.last_active_at)) < 900 THEN TRUE
          ELSE FALSE
        END AS is_online
      FROM gamification_profiles gp
      ORDER BY gp.xp_total DESC
    `);

    // Seed default admin user (each independently)
    await safeQuery(client, "seed:users", `
      INSERT INTO users (id, username, role) VALUES (1, 'Benjamin', 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

    await safeQuery(client, "seed:gamification_profiles", `
      INSERT INTO gamification_profiles (user_id, username, xp_total, level, role_multiplier)
      VALUES (1, 'Benjamin', 0, 1, 2.0)
      ON CONFLICT (user_id) DO NOTHING
    `);

    console.log("[DB] Database initialization complete");
  } catch (error) {
    console.error("[DB] Fatal error during initialization:", error);
  } finally {
    client.release();
  }
}
