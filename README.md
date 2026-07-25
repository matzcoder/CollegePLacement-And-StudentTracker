Here's your README restyled in the same visual language — capsule headers, typing SVG, badge rows, mermaid flows, and status tables — but with a **light / pastel theme** (soft slate‑blue gradients, sky accents, dark text).

Copy everything inside the block below into your `README.md`:

````markdown
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:e0f2fe,50:ede9fe,100:f8fafc&height=200&section=header&text=Placement%20Tracker&fontSize=50&fontColor=1e3a8a&animation=fadeIn&fontAlignY=35&desc=College%20Placement%20Drive%20%7C%20Student%20Application%20Tracker&descSize=18&descAlignY=55&descAlign=50"/>
</p>

<div align="center">

  [![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=22&duration=3000&pause=1000&color=2563EB&center=true&vCenter=true&width=650&lines=Full-Stack+Placement+Management;Zero-Database+Cookie+Architecture;Role-Based+Portals+%7C+Student+%7C+Officer+%7C+Admin;Rule-Based+AI+Assistant)](https://git.io/typing-svg)

</div>

<p align="center">
  <a href="#-quick-start" target="_blank">
    <img src="https://img.shields.io/badge/🚀_LIVE_DEMO-DBEAFE?style=for-the-badge&logo=vercel&logoColor=1E3A8A&labelColor=F8FAFC" />
  </a>
  <img src="https://img.shields.io/badge/React_18-E0F2FE?style=for-the-badge&logo=react&logoColor=0EA5E9&labelColor=F8FAFC" />
  <img src="https://img.shields.io/badge/Vite-EDE9FE?style=for-the-badge&logo=vite&logoColor=7C3AED&labelColor=F8FAFC" />
  <img src="https://img.shields.io/badge/TypeScript-DBEAFE?style=for-the-badge&logo=typescript&logoColor=3178C6&labelColor=F8FAFC" />
  <img src="https://img.shields.io/badge/Tailwind-CFFAFE?style=for-the-badge&logo=tailwindcss&logoColor=0891B2&labelColor=F8FAFC" />
  <img src="https://img.shields.io/badge/Cookie_Storage-FEF3C7?style=for-the-badge&logo=cookiecutter&logoColor=B45309&labelColor=F8FAFC" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built_for-SIH_2026-E0E7FF?style=for-the-badge&labelColor=F8FAFC&color=E0E7FF" />
  <img src="https://img.shields.io/badge/License-MIT-DCFCE7?style=for-the-badge&labelColor=F8FAFC" />
  <img src="https://img.shields.io/badge/Database-NOT_REQUIRED-FCE7F3?style=for-the-badge&labelColor=F8FAFC" />
</p>

---

## ☀️ The Problem

> Placement cells run on **manual Excel sheets**, **WhatsApp forwards**, and **scattered emails**.
>
> Students have **zero real-time visibility** into their application pipeline.
> Administrators have **no aggregate analytics** to drive decisions.

**Placement Tracker** replaces all of it with one browser-native workspace.

---

## 🧭 The Light Architecture

<div align="center">

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#dbeafe', 'primaryTextColor':'#1e293b', 'primaryBorderColor':'#2563eb', 'lineColor':'#7c3aed', 'secondaryColor':'#ede9fe', 'tertiaryColor':'#f1f5f9', 'background':'#ffffff', 'fontSize':'15px'}}}%%
graph TD
    A[🎓 User Login] -->|RBAC Session Cookie| B{React SPA · Vite}
    B --> C[Student Portal]
    B --> D[Officer Portal]
    B --> E[Admin Panel]

    C --> F[🍪 Cookie Session Store]
    D --> F
    E --> F

    F --> G[Drives & Companies]
    F --> H[Applications & Stages]
    F --> I[Audit Logs]
    F --> J[Analytics & Reports]

    G --> K[🤖 Rule-Based AI Assistant]
    H --> K
    K --> L[Scoped Answers · Own Data Only]

    style A fill:#bfdbfe,stroke:#2563eb,stroke-width:2px,color:#1e293b
    style B fill:#f1f5f9,stroke:#7c3aed,stroke-width:2px,color:#1e293b
    style F fill:#fef3c7,stroke:#d97706,stroke-width:3px,color:#1e293b
    style K fill:#ede9fe,stroke:#7c3aed,stroke-width:3px,color:#1e293b
    style L fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#1e293b
    style C fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#1e293b
    style D fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#1e293b
    style E fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#1e293b
```

</div>

---

## ⚡ Core Capabilities

| Capability | Description | Status |
|---|---|---|
| 🎓 **Student Portal** | Browse drives, apply, track application stages | `ACTIVE` |
| 🧑‍💼 **Officer Portal** | Manage companies & drives, update stages, reports | `ACTIVE` |
| 🛡️ **Admin Panel** | Full CRUD, user management, audit logs, analytics | `ACTIVE` |
| 🤖 **AI Assistant** | Rule-based intent engine scoped to the logged-in student | `ACTIVE` |
| 🍪 **Cookie Sessions** | All data + auth persist in browser cookies | `ACTIVE` |
| 📊 **Analytics** | Recharts-powered aggregate placement insights | `ACTIVE` |
| 🔐 **RBAC** | Role-gated routes and data visibility | `ACTIVE` |

---

## 🎭 Role-Based Command Centers

<div align="center">

| Role | Access | Purpose |
|:---:|:---|:---|
| 🎓 **Student** | `/dashboard` | Drive discovery, applications, stage tracking, AI chat |
| 🧑‍💼 **Officer** | `/officer` | Company & drive management, stage updates, reports |
| 🛡️ **Admin** | `/admin` | Full CRUD, user management, audit trail, analytics |

</div>

---

## 🏗️ Zero-Database Architecture

> **No PostgreSQL. No MongoDB. No backend server in production.**
>
> Everything is serialized into **chunked browser cookies**. Zero config, zero cost, zero infra.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#dbeafe', 'primaryTextColor':'#1e293b', 'primaryBorderColor':'#2563eb', 'lineColor':'#7c3aed', 'secondaryColor':'#ede9fe', 'tertiaryColor':'#f1f5f9', 'background':'#ffffff'}}}%%
flowchart LR
    A[User Action] --> B[React State]
    B --> C[JSON Serialize]
    C --> D[🍪 Chunked Cookies<br/>pt_data_*]
    D --> E[Session Cookie<br/>pt_session]
    E --> F[Rehydrate on Reload]
    F --> B

    style A fill:#bfdbfe,stroke:#2563eb,stroke-width:2px,color:#1e293b
    style B fill:#f1f5f9,stroke:#7c3aed,stroke-width:2px,color:#1e293b
    style C fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#1e293b
    style D fill:#fef3c7,stroke:#d97706,stroke-width:3px,color:#1e293b
    style E fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#1e293b
    style F fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#1e293b
```

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite · TypeScript |
| **Styling** | Tailwind CSS · shadcn/ui |
| **Charts** | Recharts |
| **Data** | Browser cookies (chunked JSON) + session cookie |
| **AI** | Client-side rule-based intent engine |
| **Auth** | Cookie session + RBAC |
| **Backend** *(optional, local dev)* | Node.js · Express · Prisma `LEGACY` |
| **Deploy** | Vercel (static SPA) |

---

## 🚀 Quick Start

### 📋 Prerequisites
- **Node.js 18+** and npm

### 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/<your-username>/placement-tracker.git
cd placement-tracker/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) 🎉
All data lives in your **browser cookies** — no setup required.

### ▲ Deploy to Vercel

```bash
cd frontend
npx vercel
```

Or via dashboard:

| Step | Action |
|:---:|---|
| 1️⃣ | Push this repo to GitHub |
| 2️⃣ | Import the project in [Vercel](https://vercel.com) |
| 3️⃣ | Set **Root Directory** → `placement-tracker/frontend` |
| 4️⃣ | Deploy — the included `vercel.json` handles the rest |

---

## 🔑 Demo Credentials

<div align="center">

| Role | Email | Password |
|:---:|:---|:---|
| 🛡️ **Admin** | `admin@college.edu` | `Admin@1234` |
| 🧑‍💼 **Officer** | `officer@college.edu` | `Officer@1234` |
| 🎓 **Student** | `riya.sharma@college.edu` | `Student@1234` |

</div>

> 💡 **No API keys, no `.env`, no database** — log in and the seeded demo data loads instantly.

---

## 🎬 Demo Flow

Perfect for presentations & portfolio showcases:

| Flow | Description |
|---|---|
| 🎓 **Student Journey** | Login → Dashboard → Browse drives → Apply → Track stages |
| 🧑‍💼 **Officer Journey** | Login → Create drive → Move applicants through stages → Export report |
| 🛡️ **Admin Journey** | Login → Manage users → Inspect audit log → Review analytics |
| 🤖 **AI Assistant** | "What's my application status?" · "Which drives am I eligible for?" |

---

## 🍪 Data Storage

All placement data — **students, companies, drives, applications, audit logs** — is serialized into **chunked cookies** (`pt_data_*`). The active session is stored in `pt_session`.

| Cookie | Contents |
|---|---|
| `pt_data_*` | Chunked JSON app state |
| `pt_session` | Logged-in user + role claims |

> 🔄 **Reset demo data:** clear site cookies for the app origin, or use
> **DevTools → Application → Cookies → Clear**

---

## 🗄️ Legacy Backend *(Optional)*

The `backend/` folder contains the original **Express + Prisma** API.
It is **not required** for Vercel deployment.

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

---

## 📸 Screenshots

<div align="center">

| Login | Student Dashboard | Admin Panel | AI Assistant |
|:---:|:---:|:---:|:---:|
| ![login](screenshots/login.png) | ![student](screenshots/student-dashboard.png) | ![admin](screenshots/admin-dashboard.png) | ![assistant](screenshots/assistant.png) |

</div>

---

## 🔭 Future Scope

| Roadmap Item | Description | Status |
|---|---|---|
| 📄 **Resume Parsing** | Auto-extract CGPA & skills from uploaded resumes | `PLANNED` |
| 📧 **Notifications** | Email + WhatsApp stage alerts | `PLANNED` |
| 📱 **Mobile App** | React Native companion app | `PLANNED` |
| ☁️ **Cloud Sync** | Optional Supabase / PlanetScale persistence | `PLANNED` |

---

## 👥 Contributors

<p align="center">
  Built with ☕ for <b>SIH 2026 — Internal Practical Assessment</b>
</p>

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <a href="#-quick-start">
    <img src="https://img.shields.io/badge/🚀_Get_Started-DBEAFE?style=for-the-badge&logo=vercel&logoColor=1E3A8A&labelColor=F8FAFC" />
  </a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:f8fafc,50:ede9fe,100:e0f2fe&height=100&section=footer&animation=fadeIn"/>
</p>
````

**Light-theme palette used** (swap these hexes if you want a different accent):

| Token | Hex | Use |
|---|---|---|
| Header gradient | `#e0f2fe → #ede9fe → #f8fafc` | Capsule banners |
| Primary accent | `#2563eb` | Typing SVG, borders |
| Secondary accent | `#7c3aed` | Mermaid link lines |
| Highlight (cookies) | `#fef3c7 / #d97706` | Storage nodes |
| Success | `#dcfce7 / #16a34a` | Output nodes |
| Text | `#1e293b` | All diagram labels |

Two things to update before publishing: the **clone URL** (`<your-username>`) and the **live demo link** if you deploy it — then swap the `#-quick-start` anchors for the real Vercel URL.
