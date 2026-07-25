# Vercel Deployment Guide

This project deploys as **two separate Vercel projects** from the same repository:
- `placement-tracker/frontend/` — React + Vite SPA (fully self-contained, no backend needed)
- `placement-tracker/backend/` — Express API as Vercel Serverless Functions (optional, for real PostgreSQL)

---

## Quick Deploy — Frontend Only (Recommended)

The frontend runs completely standalone using browser cookie storage. No database or backend required.

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository
3. Set **Root Directory** to `placement-tracker/frontend`
4. Click **Deploy** — no environment variables needed

**That's it.** The app will be live at your Vercel URL.

---

## Full Stack Deploy — Frontend + Backend

### Step 1 — Set up a PostgreSQL database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2 — Deploy the Backend

1. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Set **Root Directory** to `placement-tracker/backend`
3. Add these **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | A random string, min 32 chars |
| `JWT_ACCESS_EXPIRY` | `30m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `CLIENT_ORIGIN` | Your frontend Vercel URL (set after frontend is deployed) |
| `NODE_ENV` | `production` |

4. Click **Deploy**
5. Note your backend URL (e.g. `https://placement-tracker-api.vercel.app`)

### Step 3 — Run the database migration

From your local machine with `DATABASE_URL` pointing to Neon in your `.env`:

```bash
cd placement-tracker/backend
npm run prisma:migrate:deploy   # creates all tables
npm run prisma:seed             # loads demo data
```

### Step 4 — Deploy the Frontend (with backend)

1. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Set **Root Directory** to `placement-tracker/frontend`
3. Add **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` |

4. Click **Deploy**

> **Note:** The frontend currently routes all API calls through its local mock (cookie store) by default.
> To switch to the real backend, update `frontend/src/services/api.ts` to use `VITE_API_URL` instead
> of `handleLocalRequest`. The local mock is fully functional for demos without any backend.

### Step 5 — Update CORS

In your **backend** Vercel project → Settings → Environment Variables:
- Set `CLIENT_ORIGIN` to your frontend URL (e.g. `https://placement-tracker.vercel.app`)
- Redeploy

---

## Local Development

```bash
# Terminal 1 — Frontend (standalone, no backend needed)
cd placement-tracker/frontend
npm install
npm run dev
# → http://localhost:5173

# Terminal 2 — Backend (optional, needs PostgreSQL)
cd placement-tracker/backend
cp .env.example .env
# Edit .env with your local PostgreSQL or Neon URL
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
# → http://localhost:3001
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | Admin@1234 |
| Officer | officer@college.edu | Officer@1234 |
| Student | riya.sharma@college.edu | Student@1234 |

---

## Architecture

```
Vercel Project 1: placement-tracker-frontend
├── React + Vite SPA
├── vercel.json → rewrites all routes to index.html (SPA routing)
└── Fully self-contained: cookie-based data store, no backend needed

Vercel Project 2: placement-tracker-backend  (optional)
├── Express app → Vercel Serverless via src/index.ts
├── vercel.json → routes all /api/* to src/index.ts
├── Prisma + PostgreSQL (Neon)
└── JWT auth, bcrypt passwords, rate limiting, audit logs
```

---

## Troubleshooting

**CORS errors** → Ensure `CLIENT_ORIGIN` in backend exactly matches your frontend URL (no trailing slash).

**`PrismaClientInitializationError`** → Make sure `DATABASE_URL` is set in Vercel env vars and includes `?sslmode=require`.

**`prisma generate` not running** → The `vercel-build` script in `backend/package.json` handles this automatically.

**Blank page after deploy** → Check that `vercel.json` in `frontend/` has the SPA rewrite rule (`"source": "/(.*)", "destination": "/index.html"`).
