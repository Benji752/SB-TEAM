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
 * Auto-initialize missing database tables and views.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to call on every startup.
 */
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Core tables
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'model' CHECK (role IN ('admin', 'model'))
      );

      CREATE TABLE IF NOT EXISTS auth_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'model' CHECK (role IN ('admin', 'model')),
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

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
      );

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
      );

      CREATE TABLE IF NOT EXISTS agency_stats (
        id SERIAL PRIMARY KEY,
        month TEXT NOT NULL,
        revenue INTEGER DEFAULT 0,
        new_subscribers INTEGER DEFAULT 0,
        churn_rate INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prospects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        channel_id TEXT,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS drive_assets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        type TEXT,
        owner_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS drive_files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        type TEXT,
        folder_id INTEGER,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS client_requests (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_payment',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        service_type TEXT NOT NULL DEFAULT 'Custom',
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS model_stats (
        id SERIAL PRIMARY KEY,
        is_online BOOLEAN NOT NULL,
        current_price INTEGER NOT NULL,
        strip_score INTEGER DEFAULT 0,
        favorites INTEGER DEFAULT 0,
        subscribers INTEGER DEFAULT 0,
        hourly_revenue DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
        status TEXT NOT NULL DEFAULT 'pending',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        time TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id SERIAL PRIMARY KEY,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        has_image BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS group_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        sender_username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Gamification tables
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
      );

      CREATE TABLE IF NOT EXISTS hunter_leads (
        id SERIAL PRIMARY KEY,
        client_username TEXT NOT NULL,
        platform TEXT NOT NULL,
        finder_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        xp_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        validated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS work_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS xp_activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        xp_gained INTEGER NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Leaderboard view
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
      ORDER BY gp.xp_total DESC;

      -- Seed default admin user
      INSERT INTO users (id, username, role) VALUES (1, 'Benjamin', 'admin')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO profiles (id, user_id, username, role) VALUES (1, 1, 'Benjamin', 'admin')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO gamification_profiles (user_id, username, xp_total, level, role_multiplier)
      VALUES (1, 'Benjamin', 0, 1, 2.0)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log("[DB] Database tables and views initialized successfully");
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
  } finally {
    client.release();
  }
}
