-- =============================================
-- SB TEAM - Complete Database Schema for Supabase
-- Execute this SQL in Supabase SQL Editor
-- =============================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS xp_activity_log CASCADE;
DROP TABLE IF EXISTS work_sessions CASCADE;
DROP TABLE IF EXISTS hunter_leads CASCADE;
DROP TABLE IF EXISTS gamification_profiles CASCADE;
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS model_stats CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS client_requests CASCADE;
DROP TABLE IF EXISTS drive_files CASCADE;
DROP TABLE IF EXISTS drive_assets CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS agency_stats CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS gamification_leaderboard_view CASCADE;

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'model' CHECK (role IN ('admin', 'model'))
);

-- Auth Logs table
CREATE TABLE auth_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'model' CHECK (role IN ('admin', 'model')),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
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

-- Tasks table
CREATE TABLE tasks (
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

-- Agency Stats table
CREATE TABLE agency_stats (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  revenue INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  churn_rate INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prospects table
CREATE TABLE prospects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT,
  channel_id TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drive Assets table
CREATE TABLE drive_assets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drive Files table
CREATE TABLE drive_files (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  folder_id INTEGER,
  owner_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client Requests table
CREATE TABLE client_requests (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Custom',
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Model Stats table
CREATE TABLE model_stats (
  id SERIAL PRIMARY KEY,
  is_online BOOLEAN NOT NULL,
  current_price INTEGER NOT NULL,
  strip_score INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  subscribers INTEGER DEFAULT 0,
  hourly_revenue DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat History table
CREATE TABLE ai_chat_history (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  has_image BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group Messages table (Team Chat)
CREATE TABLE group_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  sender_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- GAMIFICATION TABLES (SB HUNTER LEAGUE)
-- =============================================

-- Gamification Profiles table
CREATE TABLE gamification_profiles (
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

-- Hunter Leads table
CREATE TABLE hunter_leads (
  id SERIAL PRIMARY KEY,
  client_username TEXT NOT NULL,
  platform TEXT NOT NULL,
  finder_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP
);

-- Work Sessions table
CREATE TABLE work_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- XP Activity Log table
CREATE TABLE xp_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  xp_gained INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- GAMIFICATION LEADERBOARD VIEW
-- =============================================

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

-- =============================================
-- SEED DATA - Default Mock User for MOCK_AUTH
-- =============================================

-- Insert default mock user (matching MOCK_USER_NUMERIC_ID = 1)
INSERT INTO users (id, username, role) VALUES (1, 'Benjamin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, username, role) VALUES (1, 1, 'Benjamin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gamification_profiles (user_id, username, xp_total, level, role_multiplier) 
VALUES (1, 'Benjamin', 0, 1, 2.0)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- DONE! All tables are now created.
-- =============================================
