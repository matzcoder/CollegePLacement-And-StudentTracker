# 🎓 College Placement Drive & Student Application Tracker

> A full-stack placement management system built for **SIH 2026**, tracking student applications, placement drives, companies, and AI-assisted queries — deployable to Vercel in minutes.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started (Local)](#getting-started-local)
- [Deploy to Vercel](#deploy-to-vercel)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [AI Assistant](#ai-assistant)
- [Role-Based Access Control](#role-based-access-control)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Placement Tracker** solves a real problem faced by college placement cells — coordinating drives via Excel sheets, WhatsApp, and email with no real-time visibility for students or actionable analytics for administrators.

This system provides:
- A **Student Portal** to track personal application pipelines and interact with an AI assistant
- A **Placement Officer Portal** to manage companies, drives, and update application statuses
- An **Admin Panel** with full CRUD, user management, audit logs, and aggregate analytics
- A **fully self-contained frontend** that works without any backend (data persisted in browser cookies) — deploy to Vercel with zero configuration

---

## Features

### Student Portal
- View personal KPI cards: Total Applied, Shortlisted, Offers Received
- Track application stage and offer status per company
- Floating AI Assistant chat widget scoped to personal data
- Persistent login session via cookies

### Placement Officer Portal
- All student features plus:
- Create and manage companies (name, industry, package range, website)
- Schedule and manage placement drives (date, role, CGPA cutoff, eligible departments)
- Update application stages and offer statuses with package amounts
- View placement reports with filtering

### Admin Panel
- All officer features plus:
- Analytics dashboard: 7 KPI cards, bar chart (applications by stage), pie chart (students by department)
- User management: role assignment, account deactivation, session revocation
- Immutable audit log of all system activity
- Add new students with linked user accounts

### AI Assistant
- Rule-based intent engine with 6 intents
- Scoped strictly to the logged-in student's own data
- Natural language responses with placement-specific context
- Interaction history logged for admin audit

### Infrastructure
- Fully self-contained SPA — no backend or database required for Vercel deployment
- Optional Express + PostgreSQL backend for production persistence
- Cookie-chunked storage handles payloads beyond the 4KB per-cookie limit
- JWT access tokens with denylist + refresh token rotation (backend mode)
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Bcrypt password hashing (12 rounds)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.10 |
| Language | TypeScript | 5.6.3 |
| Styling | Tailwind CSS | 3.4.14 |
| UI Primitives | Radix UI (shadcn-style) | various |
| Charts | Recharts | 2.13.0 |
| Routing | React Router DOM | 6.27.0 |
| Backend Framework | Express | 4.21.1 |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL (Neon) | — |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| Password Hashing | bcrypt | 5.1.1 |
| Validation | Zod | 3.23.8 |
| Logging | Winston | 3.17.0 |
| Rate Limiting | express-rate-limit | 7.4.1 |
| Deployment | Vercel | — |

---

## Project Structure

```
placement-tracker/
├── frontend/                         # React + Vite SPA
│   ├── index.html                    # HTML entry point
│   ├── vite.config.ts                # Vite configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── tsconfig.json                 # TypeScript config
│   ├── vercel.json                   # SPA catch-all rewrite
│   └── src/
│       ├── main.tsx                  # React root render
│       ├── App.tsx                   # Router + protected routes
│       ├── index.css                 # Tailwind directives + animations
│       ├── ai-assistant/
│       │   └── intentEngine.ts       # Rule-based NLP intent classifier
│       ├── context/
│       │   └── AuthContext.tsx       # Login / logout / session restore
│       ├── data/
│       │   ├── types.ts              # All TypeScript interfaces
│       │   └── seedData.ts           # Demo data (3 students, 5 users, 3 companies)
│       ├── lib/
│       │   └── cookieStorage.ts      # Chunked cookie read/write helpers
│       ├── pages/
│       │   ├── LoginPage.tsx         # Login form + demo credential buttons
│       │   ├── StudentDashboard.tsx  # Student portal + AI chat widget
│       │   └── AdminDashboard.tsx    # Officer/Admin portal (5 tabs, full CRUD)
│       └── services/
│           ├── api.ts                # Axios-like HTTP client (routes to localApi)
│           ├── dataStore.ts          # In-memory + cookie persistence layer
│           └── localApi.ts           # Complete mock REST API (runs in-browser)
│
├── backend/                          # Express + Prisma API (optional)
│   ├── src/
│   │   ├── app.ts                    # Express app setup, CORS, middleware, routes
│   │   ├── index.ts                  # Vercel serverless entry point
│   │   ├── server.ts                 # Local dev server (app.listen)
│   │   ├── config/
│   │   │   ├── db.ts                 # PrismaClient singleton (serverless-safe)
│   │   │   └── env.ts                # Environment variable config
│   │   ├── ai-assistant/
│   │   │   ├── intentEngine.ts       # Intent detection
│   │   │   ├── keywordMap.ts         # Keyword-to-intent mappings
│   │   │   └── responseTemplates.ts  # Natural language response builder
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Register, login, logout, refresh
│   │   │   ├── adminController.ts    # Users, roles, audit, reports, add student
│   │   │   ├── applicationController.ts  # Apply, list, update, withdraw
│   │   │   ├── assistantController.ts    # AI query + history
│   │   │   ├── companyController.ts      # CRUD companies
│   │   │   ├── dashboardController.ts    # Student + admin dashboards
│   │   │   ├── driveController.ts        # CRUD placement drives
│   │   │   └── notificationController.ts # List + mark read
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts     # JWT verify + denylist check
│   │   │   ├── auditLog.ts           # Activity log writer
│   │   │   ├── errorHandler.ts       # Global error handler + createError()
│   │   │   └── roleMiddleware.ts     # requireRole(...roles) factory
│   │   ├── routes/
│   │   │   ├── authRoutes.ts         # /api/auth
│   │   │   ├── adminRoutes.ts        # /api/admin
│   │   │   ├── applicationRoutes.ts  # /api/applications
│   │   │   ├── assistantRoutes.ts    # /api/assistant
│   │   │   ├── companyRoutes.ts      # /api/companies
│   │   │   ├── dashboardRoutes.ts    # /api/dashboard
│   │   │   ├── driveRoutes.ts        # /api/drives
│   │   │   └── notificationRoutes.ts # /api/notifications
│   │   ├── utils/
│   │   │   ├── hashUtils.ts          # bcrypt hash + compare
│   │   │   ├── jwtUtils.ts           # sign + verify JWT tokens
│   │   │   └── logger.ts             # Winston logger
│   │   └── prisma/
│   │       ├── schema.prisma         # 10-model PostgreSQL schema
│   │       └── seed.ts               # Database seeder
│   ├── tsconfig.json                 # TypeScript config (CommonJS target)
│   ├── package.json                  # Scripts + dependencies
│   ├── vercel.json                   # Serverless function config
│   └── .env.example                  # Environment variable template
│
├── vercel.json                       # Root: defines two Vercel projects
├── DEPLOY.md                         # Step-by-step deployment guide
└── docs/
    └── README.md                     # This file
```

---

## Architecture

### Frontend-Only Mode (Default / Vercel)

```
Browser
  └── React SPA (Vite)
        └── AuthContext  ──►  api.ts (fake HTTP client)
                                └── localApi.ts  ──►  dataStore.ts
                                                         ├── In-memory cache
                                                         └── Cookie storage
                                                               (chunked JSON)
```

All 20+ API endpoints are implemented in `localApi.ts` and run entirely in the browser. Data persists across page reloads via chunked cookies. No server, no database, no environment variables needed.

### Full Stack Mode (Optional)

```
Browser
  └── React SPA
        └── api.ts  ──►  HTTPS  ──►  Vercel Serverless Function
                                          └── Express app (src/index.ts)
                                                ├── authMiddleware (JWT + denylist)
                                                ├── roleMiddleware (RBAC)
                                                ├── Controllers
                                                └── Prisma ORM
                                                      └── PostgreSQL (Neon)
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- npm

### Run the Frontend (standalone — recommended)

```bash
cd placement-tracker/frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the app is fully functional with demo data loaded from seed.

### Run the Backend (optional)

Requires a PostgreSQL database (local or [Neon](https://neon.tech) free tier).

```bash
cd placement-tracker/backend
cp .env.example .env
# Edit .env: set DATABASE_URL to your PostgreSQL connection string
npm install
npm run prisma:migrate     # creates all tables
npm run prisma:seed        # loads demo data
npm run dev                # starts on http://localhost:3001
```

---

## Deploy to Vercel

### Frontend Only (zero config)

1. Push repo to GitHub
2. [Import at vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** → `placement-tracker/frontend`
4. Click **Deploy** ✅

### Full Stack

See **[DEPLOY.md](../DEPLOY.md)** for the complete step-by-step guide including database setup, environment variables, and CORS configuration.

---

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@college.edu | Admin@1234 | Full access: all tabs, user management, audit logs |
| Officer | officer@college.edu | Officer@1234 | Overview, applications, drives & companies |
| Student | riya.sharma@college.edu | Student@1234 | Student dashboard + AI assistant |
| Student | rahul.kumar@college.edu | Student@1234 | Student dashboard + AI assistant |
| Student | aman.verma@college.edu | Student@1234 | Student dashboard + AI assistant |

The login page has **one-click demo fill** buttons for Admin, Officer, and Student.

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register a new student account |
| POST | `/auth/login` | None | Login (rate-limited: 5/15min) |
| POST | `/auth/logout` | Bearer | Logout, revoke tokens |
| POST | `/auth/refresh` | Cookie | Refresh access token |

### Dashboard — `/api/dashboard`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/dashboard/student` | student | KPIs + applications + notifications |
| GET | `/dashboard/admin` | officer, admin | KPIs + charts + recent activity |

### Companies — `/api/companies`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/companies` | all | List companies (paginated, searchable) |
| POST | `/companies` | officer, admin | Create company |
| PUT | `/companies/:id` | officer, admin | Update company |
| DELETE | `/companies/:id` | admin | Delete company |

### Drives — `/api/drives`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/drives` | all | List drives (paginated, filterable) |
| POST | `/drives` | officer, admin | Create drive |
| PUT | `/drives/:id` | officer, admin | Update drive |
| DELETE | `/drives/:id` | admin | Delete drive |

### Applications — `/api/applications`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/applications` | all | List applications (students see only their own) |
| POST | `/applications` | student | Apply to a drive |
| PUT | `/applications/:id` | officer, admin | Update stage / offer status / package |
| DELETE | `/applications/:id` | all | Withdraw application |

### Admin — `/api/admin`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/users` | admin | List all users |
| POST | `/admin/students` | admin | Add student + linked user account |
| PUT | `/admin/users/:id/role` | admin | Change user role |
| PUT | `/admin/users/:id/deactivate` | admin | Deactivate user + revoke sessions |
| GET | `/admin/audit` | admin | Paginated audit log |
| GET | `/admin/reports` | officer, admin | Full placement report |

### Assistant — `/api/assistant`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/assistant/query` | student | Submit a natural language query |
| GET | `/assistant/history` | student | Get personal query history |

### Notifications — `/api/notifications`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/notifications` | all | List user notifications |
| PUT | `/notifications/read-all` | all | Mark all as read |
| PUT | `/notifications/:id/read` | all | Mark one as read |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", ts: "..." }` |

---

## Data Models

### Student
```
id            UUID (PK)
rollNumber    String (unique)
fullName      String
department    String
cgpa          Float
batchYear     Int
phone         String?
backlogCount  Int (default 0)
resumeUrl     String?
```

### User
```
id            UUID (PK)
name          String
email         String (unique)
passwordHash  String
role          student | officer | admin
studentId     UUID? (FK → Student, unique)
isActive      Boolean (default true)
```

### Company
```
id            UUID (PK)
name          String
industry      String?
packageMin    Float?
packageMax    Float?
website       String?
```

### PlacementDrive
```
id                   UUID (PK)
companyId            UUID (FK → Company)
driveDate            DateTime
eligibleDepartments  String?   (comma-separated, e.g. "CSE,IT,ECE")
minCgpa              Float?
roleOffered          String?
status               upcoming | ongoing | completed | cancelled
```

### Application
```
id           UUID (PK)
studentId    UUID (FK → Student)
driveId      UUID (FK → PlacementDrive)
stage        applied | shortlisted | interview | offer | rejected
offerStatus  pending | selected | rejected | offer_accepted | offer_declined
package      Float?   (INR, e.g. 550000 = ₹5.5L)
appliedOn    DateTime
```

---

## AI Assistant

The assistant uses a **keyword-scoring intent engine** — no external AI API calls, zero latency, fully offline.

### Supported Intents

| Intent | Example Queries |
|--------|----------------|
| `company_count` | "How many companies visited campus?" |
| `where_applied` | "Where did I apply?", "Show my applications" |
| `shortlist_status` | "Was I shortlisted?", "Shortlist status" |
| `offer_status` | "Did I get an offer?", "Placement result" |
| `package_query` | "What is my package?", "CTC", "Salary" |
| `application_status` | "Show my pipeline", "Current stage" |

### How it works

1. Input is lowercased and punctuation-stripped
2. Each intent has a keyword list; matching score = `matches / total_keywords`
3. Intent with highest score above **0.3 threshold** wins
4. Response is built from the student's own application data only
5. All queries are logged to `AssistantLog` for admin audit

---

## Role-Based Access Control

```
admin   → Full system access
          └── officer access
          └── User management (role changes, deactivation, session revocation)
          └── Audit logs

officer → Authenticated user access
          └── Create/update/delete companies and drives
          └── Update application stages, offer statuses, packages
          └── View placement reports and admin dashboard

student → Authenticated user access
          └── View own applications only
          └── Apply to drives
          └── Access AI assistant (scoped to own data)
          └── View own notifications
```

---

## Security

| Feature | Implementation |
|---------|---------------|
| Password storage | bcrypt with 12 rounds |
| Access tokens | JWT with `jti` claim (UUID), 30-minute expiry |
| Token revocation | `TokenDenylist` table checked on every request |
| Refresh tokens | SHA-256 hashed in `RefreshToken` table, revoked on logout/deactivation |
| Session invalidation | Deactivating a user revokes all refresh tokens |
| Rate limiting | 5 login attempts per 15 minutes per IP |
| CORS | Allowlist-based, configured via `CLIENT_ORIGIN` env var |
| Security headers | helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| Input validation | Zod schemas on all POST/PUT endpoints |
| Data isolation | Students can only access their own applications and assistant data |

---

## Environment Variables

### Backend `.env`

```env
# Database
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Auth
JWT_SECRET="your-long-random-secret-min-32-chars"
JWT_ACCESS_EXPIRY="30m"
JWT_REFRESH_EXPIRY="7d"
BCRYPT_ROUNDS=12

# Server
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (no `.env` needed for standalone mode)

```env
# Only needed if connecting to the real backend
VITE_API_URL="https://your-backend.vercel.app/api"
```

---

## Troubleshooting

**App shows blank page after Vercel deploy**
→ Verify `frontend/vercel.json` contains the SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**CORS error when calling the backend**
→ Make sure `CLIENT_ORIGIN` in backend env vars exactly matches your frontend URL — no trailing slash

**`PrismaClientInitializationError` on Vercel**
→ `DATABASE_URL` must be set in Vercel environment variables and include `?sslmode=require` for Neon

**Login fails with correct credentials**
→ In standalone (frontend-only) mode, passwords are stored as plaintext in cookie data. Clear site cookies and reload to reset to seed data

**Data resets after clearing cookies**
→ This is by design — all data lives in browser cookies in standalone mode. Use the backend + PostgreSQL for persistent data

**Backend `dev` script fails with MODULE_NOT_FOUND**
→ Run `npm run build` first, or ensure `src/server.ts` exists. The dev script uses `ts-node-dev src/server.ts`

---

## Future Scope

- Resume upload and parsing (CGPA, skills extraction)
- Email / WhatsApp notifications for drive updates
- Mobile app with React Native
- Optional cloud database sync (Supabase / PlanetScale)
- Advanced AI assistant using embeddings for semantic search
- CSV export for placement reports

---

## Contributors

Built for **SIH 2026** — Smart India Hackathon Internal Practical Assessment.

## License

MIT
