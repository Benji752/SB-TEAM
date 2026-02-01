# AgencyFlow - Model Management Dashboard

## Overview

AgencyFlow is a full-stack SaaS application for managing talent/model agencies. It provides a comprehensive dashboard for tracking models, tasks, prospects, messages, calendar events, and file storage. The application features role-based access control (admin, staff, model) with a demo login system for testing different user perspectives.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for dashboard analytics visualization
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite dev server integration
- **API Design**: RESTful endpoints under `/api/` prefix with typed route definitions in `shared/routes.ts`

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Authentication
- **Demo Mode**: Simple session-based role switching for development/demo purposes
- **Production Ready**: Replit Auth integration available in `server/replit_integrations/auth/`
- **Session Management**: Express-session with PostgreSQL store
- **User Roles**: Two-tier role system (admin, model)

### Data Models
- **Profiles**: User profiles with role assignment
- **Models**: Talent/model records with social media handles and status tracking
- **Tasks**: Kanban-style task management with priority and status
- **Agency Stats**: Revenue and subscriber analytics data

### Gamification System (SB HUNTER LEAGUE) - SAISON MENSUELLE Feb 2026
- **Objectif**: Niveau 300 par saison (progression rapide x10)
- **Formule de niveau**: `Level = Floor(XP / 100) + 1` (linéaire: 100 XP = 1 niveau)
- **Gains XP**:
  - Présence: +10 XP toutes les 10 minutes × multiplicateur de rôle
  - Commande créée: +75 XP
  - Commande payée: +75 XP (total par commande: 150 XP)
  - Login quotidien: +50 XP (première connexion du jour)
  - Night Owl Bonus: +50 XP pour actions entre 00:00-06:00
  - Leads approuvés: +150 XP × multiplicateur de rôle
- **Role Multipliers**: Staff/Admin get 2.0x XP multiplier, Models get 1.0x
- **Leaderboard**: E-Sport themed rankings with XP progress bars (supporte niveaux 3 chiffres)
- **Database Tables**: gamification_profiles, hunter_leads, work_sessions, xp_activity_log
- **Admin Season Reset**: POST `/api/dev/reset-season` - Admin-only endpoint (bypass auth):
  - Resets all gamification_profiles: xpTotal=0, level=1, currentStreak=0
  - Clears xp_activity_log, hunter_leads, and work_sessions tables
  - Requires username='Benjamin' or admin role in profiles table
  - Button visible only to admins on Leaderboard page with dark-themed confirmation modal

### Online Status System (Single Source of Truth) - REFACTORED Feb 2026
- **SQL View**: `gamification_leaderboard_view` - calculates `seconds_since_active` server-side using PostgreSQL NOW()
- **Unified Hook**: `useGamificationData()` from `client/src/hooks/useGamificationData.ts`
  - Fetches `/api/gamification/leaderboard-view` every 30s
  - Auto-pings `/api/gamification/ping` every 10 minutes when user is active
  - Provides `isUserOnline(userId: number)` function
  - Returns `leaderboard`, `currentUser`, `currentUserId`, `isLoading`
- **Ping Route**: POST `/api/gamification/ping` - updates `last_active_at` + awards 10 XP
- **Heartbeat Route**: POST `/api/gamification/heartbeat` - awards 10 XP × multiplier + daily login bonus
- **Threshold**: 900 seconds (15 minutes) - if `seconds_since_active < 900` → user is online (matches 10-min heartbeat)
- **UUID to Hash**: `uuidToInt()` function converts string UUID to consistent integer for gamification system
- **Usage (all pages use same hook)**:
  - Leaderboard.tsx: `useGamificationData()` for full leaderboard with `isOnline` field
  - Models.tsx: `isUserOnline(uuidToInt(profile.id))`
  - Messages.tsx: `isUserOnline(uuidToInt(profile.id))`
- **Visual**: Green dot = active < 5min, Gray dot = inactive > 5min
- **Behavior**: When user closes tab, pings stop → after 5 min, they appear offline on ALL pages simultaneously

### API Structure
Type-safe API contracts defined in `shared/routes.ts` using Zod schemas:
- Route definitions include HTTP method, path, input validation, and response schemas
- Shared between frontend hooks and backend routes for consistency
- Error schemas standardized for validation, not found, internal, and unauthorized responses

## External Dependencies

### Database
- **PostgreSQL**: Primary data store (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Shadcn/ui**: Pre-styled component collection based on Radix
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build and dev server
- **esbuild**: Server-side bundling for production
- **TypeScript**: Full type coverage across client, server, and shared code

### Optional Integrations (available in build allowlist)
- Stripe for payments
- OpenAI/Google Generative AI for AI features
- Nodemailer for email
- Multer for file uploads
- WebSocket (ws) for real-time features