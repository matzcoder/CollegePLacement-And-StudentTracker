# College Placement Drive & Student Application Tracker

> A full-stack placement management system built for SIH 2026, tracking student applications, placement drives, and AI-assisted queries.

---

## Problem Statement

Placement cells rely on manual Excel sheets, WhatsApp forwards, and emails to coordinate drives. Students have no real-time visibility into their application pipeline. Administrators lack aggregate analytics to make data-driven decisions.

## Features

- **Student Portal** - browse drives, apply, track application stages, and use the AI assistant
- **Placement Officer Portal** - manage companies and drives, update application stages, view reports
- **Admin Panel** - full CRUD, user management, audit logs, aggregate analytics
- **AI Assistant** - rule-based intent engine scoped to the logged-in student's own data
- **Cookie Session Storage** - all app data and auth session persist in browser cookies (Vercel-ready, no database required)

---

## Architecture

```text
React SPA (Vite)
      |
      v
Cookie Session Store (client-side)
      |
      v
Rule-Based AI Assistant (client-side)
```

Deploy as a static SPA on **Vercel** — no Express server or database needed for production.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Data | Browser cookies (chunked JSON) + session cookie |
| Backend (optional local dev) | Node.js + Express + Prisma (legacy) |
| Auth | Cookie session + RBAC |

---

## Quick Start (Vercel / Local)

### Prerequisites
- Node.js 18+ and npm

### Run locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — all data is stored in your browser cookies.

### Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `placement-tracker/frontend`
4. Deploy — Vercel will use the included `vercel.json`

Or from the frontend folder:

```bash
cd frontend
npx vercel
```

---

## Usage

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | Admin@1234 |
| Officer | officer@college.edu | Officer@1234 |
| Student | riya.sharma@college.edu | Student@1234 |

- **Students**: Login → View dashboard → Track applications → Use AI Assistant
- **Officers**: Login → Manage drives → Update application stages → View reports
- **Admins**: Login → Full CRUD → Audit logs → User management

---

## Data Storage

All placement data (students, companies, drives, applications, audit logs) is serialized to **chunked cookies** (`pt_data_*`). The logged-in user session is stored in the `pt_session` cookie. Data persists across page reloads in the same browser.

To reset demo data, clear site cookies for the app origin or use browser DevTools → Application → Cookies.

---

## Legacy Backend (Optional)

The `backend/` folder contains the original Express + Prisma API. It is **not required** for Vercel deployment. To run it locally for development:

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

---

## Screenshots

| Login | Student Dashboard | Admin Panel | AI Assistant |
|-------|------------------|-------------|--------------|
| ![login](screenshots/login.png) | ![student](screenshots/student-dashboard.png) | ![admin](screenshots/admin-dashboard.png) | ![assistant](screenshots/assistant.png) |

---

## Future Scope

- Resume parsing for CGPA and skills extraction
- Email and WhatsApp notifications
- Mobile app with React Native
- Optional cloud database sync (Supabase / PlanetScale)

---

## Contributors

Built for SIH 2026 Internal Practical Assessment.

## License

MIT
