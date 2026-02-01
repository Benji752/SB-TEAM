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

### Gamification System (SB HUNTER LEAGUE)
- **Auto-Tracking**: Invisible HeartbeatTracker component detects user activity and awards +2 XP every 5 minutes
- **Role Multipliers**: Staff/Admin get 2.0x XP multiplier, Models get 1.0x
- **Chasse (Leads)**: Declaring new prospects awards 100 XP × role multiplier upon admin approval
- **Night Owl Bonus**: +50 XP for actions between 00:00-06:00
- **Leaderboard**: E-Sport themed rankings with XP progress bars and "Temps passé aujourd'hui" tracking
- **Database Tables**: gamification_profiles, hunter_leads, work_sessions, xp_activity_log

### Online Status System (Single Source of Truth)
- **Utility Function**: `client/src/lib/onlineStatus.ts` exports `isUserOnline(lastActiveAt)`
- **Logic**: Returns `true` if `lastActiveAt` is less than 5 minutes old, otherwise `false`
- **Usage**: All pages (Leaderboard, Messages, Team) use this same function
- **Data Source**: `lastActiveAt` field in `gamification_profiles` table, updated by heartbeat
- **NEVER use**: `is_online` column from profiles table (deprecated/unreliable)
- **Visual**: 🟢 Green dot = active < 5min, ⚫ Gray dot = inactive > 5min

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