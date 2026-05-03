# Trellow - Team Task Manager

A full-stack collaborative task management application built as a simplified Trello/Asana clone. Designed to demonstrate end-to-end product thinking, clean architecture, and production-ready engineering practices.

> Live Demo: [https://trellow-production.up.railway.app/](https://trellow-production.up.railway.app/)
> Walkthrough Video: [https://www.youtube.com/watch?v=nRUuME00pNM](https://www.youtube.com/watch?v=nRUuME00pNM)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Design](#api-design)
- [Authentication & Security](#authentication--security)
- [Role-Based Access Control](#role-based-access-control)
- [Database Design](#database-design)
- [UI/UX Approach](#uiux-approach)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Engineering Decisions](#engineering-decisions)
- [License](#license)

---

## Overview

Jeera is a multi-user project and task management tool where teams can collaborate, assign work, and track delivery. It is built as a monorepo with a React frontend and an Express.js REST API backend, backed by PostgreSQL.

The application supports complete project lifecycle management - from creating a project and onboarding team members, to assigning tasks with priority levels, tracking status across a Kanban board, and reviewing team-wide progress on a central dashboard.

---

## Features

**Authentication**
- Secure signup and login with hashed passwords
- JWT-based stateless authentication
- Protected routes on both client and server

**Projects**
- Create and manage projects
- Invite team members and assign roles (Admin / Member)
- View all projects the authenticated user belongs to

**Tasks**
- Create tasks with title, description, priority, due date, and assignee
- Kanban board view with three columns: To Do, In Progress, Done
- Role-restricted actions - only Admins can create or delete tasks; Members can update status on tasks assigned to them
- Filterable task list per project

**Dashboard**
- Aggregate stats across all projects (total tasks, by status, overdue count)
- Per-project stats view
- Overdue task highlighting

**General**
- Fully responsive layout with a collapsible sidebar
- Global error handling with structured API error responses
- Input validation on both client and server using shared Zod schemas

---

## Tech Stack

| Layer      | Technology                   | Rationale                                                          |
|------------|------------------------------|--------------------------------------------------------------------|
| Frontend   | React 18 + Vite              | Fast dev experience, component-based UI, modern bundling           |
| Styling    | Vanilla CSS (design tokens)  | Full control over the design system, no framework lock-in          |
| State      | React Context + useReducer   | Lightweight global state without Redux overhead                    |
| Backend    | Express.js (Node 20)         | Minimal, flexible, well-understood REST framework                  |
| ORM        | Prisma                       | Type-safe queries, auto-migrations, clean schema definition        |
| Database   | PostgreSQL (Neon.tech)       | Relational model fits users → projects → tasks naturally           |
| Auth       | JWT + bcryptjs               | Stateless, scalable auth with industry-standard password hashing   |
| Validation | Zod                          | Schema validation shared across API layers                         |
| Deployment | Railway                      | Single-service deployment with environment variable management     |

---

## Architecture

The application is structured as a monorepo with two packages - `client` and `server`. In production, the React app is compiled into static files and served directly by Express, resulting in a single deployable service with no CORS complexity.

```
Browser → Express Server (Railway) → PostgreSQL (Neon.tech)
               ↑
        Serves /client/dist (React build)
        Handles /api/* routes
```

All API routes are prefixed with `/api`. Any non-API path falls through to `index.html`, supporting client-side routing.

---

## API Design

The REST API is organized around three core resources - `auth`, `projects`, `tasks` - and a `dashboard` module for aggregated reads.

**Auth** - `/api/auth`

| Method | Endpoint | Description         | Auth Required |
|--------|----------|---------------------|---------------|
| POST   | /signup  | Register a new user | No            |
| POST   | /login   | Login, returns JWT  | No            |
| GET    | /me      | Get current user    | Yes           |

**Projects** - `/api/projects`

| Method | Endpoint                     | Description       | Role Required |
|--------|------------------------------|-------------------|---------------|
| GET    | /                            | List user's projects | Member+    |
| POST   | /                            | Create project    | -             |
| GET    | /:projectId                  | Project details   | Member+       |
| PUT    | /:projectId                  | Update project    | Admin         |
| DELETE | /:projectId                  | Delete project    | Admin         |
| POST   | /:projectId/members          | Add member        | Admin         |
| DELETE | /:projectId/members/:userId  | Remove member     | Admin         |

**Tasks** - `/api/projects/:projectId/tasks`

| Method | Endpoint          | Description              | Role Required    |
|--------|-------------------|--------------------------|------------------|
| GET    | /                 | List tasks (filterable)  | Member+          |
| POST   | /                 | Create task              | Admin            |
| GET    | /:taskId          | Task details             | Member+          |
| PUT    | /:taskId          | Full update              | Admin            |
| PATCH  | /:taskId/status   | Update status only       | Assignee / Admin |
| DELETE | /:taskId          | Delete task              | Admin            |

**Dashboard** - `/api/dashboard`

| Method | Endpoint          | Description                   |
|--------|-------------------|-------------------------------|
| GET    | /stats            | Aggregate stats, all projects |
| GET    | /stats/:projectId | Per-project stats             |

---

## Authentication & Security

- Passwords are hashed with `bcryptjs` before storage - plaintext is never persisted
- JWTs are signed with a server-side secret and carry a 24-hour expiry
- All protected routes require an `Authorization: Bearer <token>` header
- A dedicated `auth` middleware verifies and decodes the token before the request reaches any controller
- All request bodies are validated against Zod schemas at the API boundary - malformed or missing fields are rejected before reaching business logic

---

## Role-Based Access Control

Every project has members with one of two roles: `ADMIN` or `MEMBER`. Access is enforced at the middleware level, not inside controllers.

- **ADMIN** - full CRUD on the project, its members, and all tasks
- **MEMBER** - read access to the project and tasks; can only update the status of tasks assigned to them

The RBAC middleware queries the `ProjectMember` table on each request to confirm the authenticated user's role before allowing the operation to proceed. Role checks are not duplicated in business logic.

---

## Database Design

PostgreSQL is hosted on [Neon.tech](https://neon.tech) and managed via Prisma migrations. The schema is built around four models:

- **User** - stores credentials and profile; identified by UUID
- **Project** - a workspace with name and description
- **ProjectMember** - junction table linking users to projects with a role (`ADMIN` | `MEMBER`)
- **Task** - belongs to a project; has status (`TODO` | `IN_PROGRESS` | `DONE`), priority (`LOW` | `MEDIUM` | `HIGH` | `URGENT`), due date, and separate `creatorId` and `assigneeId` foreign keys

Key decisions:
- UUIDs as primary keys to avoid enumeration attacks and improve portability
- Enums enforced at the database level for data integrity
- Separate `creatorId` and `assigneeId` on tasks - supports audit trail and enables fine-grained RBAC

---

## UI/UX Approach

The interface uses a flat, minimalist, card-based dashboard layout. All components are custom-built - no third-party UI library is used.

- A CSS design token system handles color, spacing, and typography across the entire app
- Inter is used for body text; JetBrains Mono for IDs and code-like elements
- Fully responsive with a collapsible sidebar on smaller screens
- Smooth transitions on route changes and modal open/close

---

## Project Structure

```
jeera/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── api/                # Axios instance + per-resource service modules
│       ├── components/         # Shared UI components (Button, Modal, Badge, Card, etc.)
│       ├── context/            # AuthContext - global auth state
│       ├── hooks/              # Custom hooks (useAuth, etc.)
│       ├── pages/              # Route-level views (Login, Dashboard, ProjectDetail, etc.)
│       └── utils/              # Date formatting and other helpers
│
├── server/                     # Express backend
│   ├── prisma/                 # schema.prisma + migration history
│   └── src/
│       ├── config/             # Environment variable loader
│       ├── middleware/         # auth, rbac, validate, errorHandler
│       ├── modules/            # Feature modules - each has routes, controller, service, schema
│       │   ├── auth/
│       │   ├── projects/
│       │   ├── tasks/
│       │   └── dashboard/
│       └── utils/              # ApiError class and shared utilities
│
├── railway.json                # Railway deployment config
└── README.md
```

The backend follows a **modular layered pattern** - each feature is self-contained with its own routes, controller, service, and Zod schema. Controllers handle HTTP request/response concerns only. Business logic lives in service files. Prisma queries are isolated to the service layer.

---

## Local Setup

**Prerequisites:** Node.js 20+, npm, PostgreSQL (local instance or free [Neon.tech](https://neon.tech) database)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/jeera.git
cd jeera

# 2. Install backend dependencies
cd server && npm install

# 3. Install frontend dependencies
cd ../client && npm install

# 4. Configure environment variables
cd ../server
cp .env.example .env
# Edit .env and fill in the required values (see below)

# 5. Run database migrations
npx prisma migrate dev

# 6. Start both dev servers (in separate terminals)
# Terminal 1 - backend
cd server && npm run dev

# Terminal 2 - frontend
cd client && npm run dev
```

The Vite dev server proxies `/api` requests to the Express backend, so no CORS configuration is needed during development.

---

## Environment Variables

| Variable       | Description                                                        |
|----------------|--------------------------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon.tech or local)                  |
| `JWT_SECRET`   | Secret used to sign and verify JWTs - use a long random string     |
| `NODE_ENV`     | `development` or `production`                                      |
| `PORT`         | Port for Express (Railway injects this automatically in production)|
| `VITE_API_URL` | API base URL - set to `/api` when frontend and backend share origin|

---

## Deployment

Deployed on **Railway** as a single service. The build process compiles the React app and Express serves it alongside the API from the same origin.

**Build and serve flow:**
1. `npm run build` inside `/client` generates a static bundle in `/client/dist`
2. Express serves the bundle via `express.static('client/dist')`
3. A catch-all route returns `index.html` for all non-API paths, enabling client-side routing
4. All `/api/*` requests are routed to Express controllers as normal
5. PostgreSQL is hosted on Neon.tech and connected via `DATABASE_URL`

This single-service setup eliminates the need for a separate static hosting service and avoids cross-origin configuration entirely.

---

## Engineering Decisions

**PostgreSQL over MongoDB**
The data model is inherently relational - users belong to projects through a membership table, and tasks reference both. SQL joins and foreign key constraints handle this more cleanly and safely than a document model would.

**Single Railway service**
Serving the React build from Express avoids managing two deployment pipelines and cross-origin CORS configuration. For this scope, the simplicity tradeoff is clear.

**Vanilla CSS over Tailwind or a component library**
Full, explicit control over the design system with no abstraction overhead. Every style decision is intentional and traceable.

**Zod for validation**
Schemas are defined once and enforced consistently at the API boundary. Validation errors are structured and easy to surface to the client without extra mapping logic.

**React Context over Redux**
The application's state surface - primarily auth state and per-page data fetched from the API - does not justify the boilerplate cost of Redux. Context with `useReducer` is sufficient and keeps the codebase lean.

---

## License

MIT
