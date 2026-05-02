# Trellow — Team Task Manager

A full-stack collaborative task management app built with React, Express.js, Prisma, and PostgreSQL.

## Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Project Management** — Create projects, invite team members by email
- **Task Management** — Create, assign, and track tasks with priorities and due dates
- **Role-Based Access** — Admin (full control) and Member (view + update own tasks) roles
- **Dashboard** — Stats overview with task breakdowns by status, priority, and assignee
- **Task Board** — Three-column board (To Do, In Progress, Done) per project

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Express.js 5, Prisma ORM, Zod validation |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## Project Structure

```
trellow/
├── client/          React frontend (Vite)
│   └── src/
│       ├── api/     API service modules
│       ├── components/  Layout, ProtectedRoute
│       ├── context/     AuthContext
│       └── pages/       Login, Signup, Dashboard, Projects, ProjectDetail
├── server/          Express backend
│   ├── prisma/      Schema + seed
│   └── src/
│       ├── middleware/  auth, rbac, error
│       └── routes/      auth, projects, tasks, dashboard
└── package.json     Root scripts for deployment
```

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud like [Neon](https://neon.tech), [Supabase](https://supabase.com))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd trellow

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In server/, create .env from the template
cp server/.env.example server/.env
# Edit server/.env and set your DATABASE_URL
```

### 3. Set Up Database

```bash
cd server
npx prisma migrate dev --name init
npm run db:seed  # Optional: load demo data
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 3000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api to backend)
cd client
npm run dev
```

Open http://localhost:5173

### Demo Credentials (after seeding)

| Email | Password |
|-------|----------|
| alice@trellow.com | password123 |
| bob@trellow.com | password123 |
| carol@trellow.com | password123 |

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Projects
- `GET /api/projects` — List user's projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Project details
- `PUT /api/projects/:id` — Update project (Admin)
- `DELETE /api/projects/:id` — Delete project (Admin)
- `POST /api/projects/:id/members` — Add member (Admin)
- `DELETE /api/projects/:id/members/:userId` — Remove member (Admin)

### Tasks
- `GET /api/projects/:id/tasks` — List tasks
- `POST /api/projects/:id/tasks` — Create task (Admin)
- `PUT /api/projects/:id/tasks/:taskId` — Update task (Admin)
- `PATCH /api/projects/:id/tasks/:taskId/status` — Update status (Assignee/Admin)
- `DELETE /api/projects/:id/tasks/:taskId` — Delete task (Admin)

### Dashboard
- `GET /api/dashboard/stats` — Aggregated stats

## Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project
3. Add a PostgreSQL database service
4. Connect your GitHub repo
5. Set environment variables:
   - `DATABASE_URL` — auto-linked from Railway PostgreSQL
   - `JWT_SECRET` — generate a strong random string
   - `NODE_ENV` — `production`
6. Railway will run `npm run build` then `npm start` automatically

## License

MIT
