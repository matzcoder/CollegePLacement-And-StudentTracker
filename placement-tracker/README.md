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
- **Security** - JWT + bcrypt, RBAC middleware, token denylist, rate limiting, parameterized queries

---

## Architecture

```text
React SPA  -->  Express REST API  -->  PostgreSQL / SQLite
                         |
                         v
                  Rule-Based AI Assistant
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL / SQLite + Prisma ORM |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest |

---

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ if using the Docker/Postgres setup

### 1. Clone & install

```bash
git clone https://github.com/your-org/placement-tracker.git
cd placement-tracker
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | Admin@1234 |
| Officer | officer@college.edu | Officer@1234 |
| Student | riya.sharma@college.edu | Student@1234 |

- **Students**: Login -> Browse Drives -> Apply -> Track Status -> Use AI Assistant
- **Officers**: Login -> Manage Drives -> Update Application Stages -> View Reports
- **Admins**: Login -> Full CRUD -> Audit Logs -> System Settings

---

## API Documentation

Health check available at `http://localhost:3001/api/health` when the backend is running.

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
- Cloud deployment with Docker and AWS/GCP

---

## Contributors

Built for SIH 2026 Internal Practical Assessment.

## License

MIT
