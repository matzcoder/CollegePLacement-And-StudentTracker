# Vercel Deployment Guide

This project deploys as **two separate Vercel projects** from the same repository:
- `frontend/` — React + Vite SPA
- `backend/` — Express API as Vercel Serverless Functions

---

## Prerequisites

- [Vercel account](https://vercel.com)
- [Neon account](https://neon.tech) (free PostgreSQL — recommended) or any PostgreSQL provider
- Vercel CLI (optional): `npm i -g vercel`

---

## Step 1 — Set Up the Database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the **connection string** from the Neon dashboard. It looks like:
   ```
   postgresql://user:pass@ep-xxx-yyy.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep this handy — you'll paste it as `DATABASE_URL` in the backend Vercel project.

---

## Step 2 — Deploy the Backend

### Option A: Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your repo, then set **Root Directory** to `placement-tracker/backend`
3. Vercel will auto-detect it as a Node.js project
4. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | A long random string (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | `30m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `CLIENT_ORIGIN` | Your frontend Vercel URL (e.g. `https://placement-tracker.vercel.app`) |
| `NODE_ENV` | `production` |

5. Click **Deploy**

### Option B: Vercel CLI

```bash
cd placement-tracker/backend
vercel --prod
```

Follow the prompts and set environment variables when asked, or add them in the Vercel dashboard after.

### After deploying the backend

Run the database migration to create all tables:

```bash
# From backend/ directory, with DATABASE_URL set in your local .env pointing at Neon:
npm run prisma:migrate:deploy
```

Optionally seed the database with sample data:

```bash
npm run prisma:seed
```

Note your backend URL — it will look like `https://placement-tracker-backend.vercel.app`

---

## Step 3 — Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your repo, set **Root Directory** to `placement-tracker/frontend`
3. Vercel auto-detects Vite — build command is `tsc && vite build`, output dir is `dist`
4. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your backend Vercel URL (e.g. `https://placement-tracker-api.vercel.app/api`) |

5. Click **Deploy**

> **Note:** The frontend currently runs fully standalone using browser-based local storage (no backend required). The `VITE_API_URL` env var is for when you want to switch from the local mock API to the real backend.

---

## Step 4 — Update CORS

Once both are deployed, go back to your **backend** project in the Vercel dashboard:

- Update `CLIENT_ORIGIN` to your actual frontend URL (e.g. `https://placement-tracker-frontend.vercel.app`)
- Redeploy the backend (Vercel does this automatically when you save env vars)

---

## Local Development

```bash
# Terminal 1 — Backend
cd placement-tracker/backend
cp .env.example .env
# Edit .env with your local PostgreSQL or Neon URL
npm install
npm run prisma:migrate        # creates tables
npm run prisma:seed           # optional: seed sample data
npm run dev

# Terminal 2 — Frontend
cd placement-tracker/frontend
npm install
npm run dev
```

---

## Architecture Summary

```
Vercel Project 1: placement-tracker-frontend
├── React + Vite SPA
├── vercel.json → rewrites all routes to index.html (SPA routing)
└── Self-contained: works without backend via browser localStorage

Vercel Project 2: placement-tracker-backend
├── Express app exposed as serverless function via src/index.ts
├── vercel.json → routes all requests to src/index.ts
├── Prisma + PostgreSQL (Neon)
└── JWT auth, rate limiting, audit logs
```

---

## Troubleshooting

**`PrismaClientInitializationError` on Vercel**
→ Make sure `DATABASE_URL` is set in Vercel environment variables and the Neon database is accessible. Ensure `?sslmode=require` is in the connection string.

**CORS errors from frontend**
→ Make sure `CLIENT_ORIGIN` in the backend matches your frontend's exact Vercel URL (no trailing slash).

**`prisma generate` not running on Vercel build**
→ The `vercel-build` script in `package.json` handles this: it runs `prisma generate` before `tsc`.

**SQLite errors**
→ The project has been migrated to PostgreSQL. Delete any `*.db` files and make sure `DATABASE_URL` points to a PostgreSQL URL.
