# CampusSphere AI - Smart Campus NOC

An enterprise-grade, AI-powered **Smart Campus Network Operations Center (NOC)** that unifies network monitoring, digital twin visualization, security awareness, and voice-assisted operations in a single command platform.

## 1. Project Overview

`CampusSphere AI` is designed as a modern operations platform for campus IT teams, admins, and technical evaluators who need a real-time view of campus health and fast incident response workflows.

### What this project demonstrates

- **Operational Visibility:** Real-time-style metrics for network health, users, access points, bandwidth, and alerts.
- **Campus Digital Twin UX:** Map-first experience with layered campus context for faster situational understanding.
- **AI-Assisted Operations:** Voice-driven command center and action-oriented workflows for NOC use cases.
- **Enterprise Architecture Thinking:** Clear separation of frontend experience, backend APIs, and deployment tooling.

### Tech stack at a glance

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Three.js + Recharts
- **Backend:** FastAPI + Python
- **Data Layer:** MongoDB integration support
- **Deployment:** Docker + Docker Compose

### Repository structure

```text
.
├─ backend/                  # FastAPI service, telemetry and API endpoints
│  ├─ main.py                # Backend entrypoint and API routes
│  ├─ requirements.txt       # Python dependencies
│  └─ Dockerfile             # Backend container definition
├─ frontend/                 # React + TypeScript web client
│  ├─ src/
│  │  ├─ App.tsx             # Main application UI and module orchestration
│  │  ├─ main.tsx            # Frontend bootstrap
│  │  └─ styles.css          # Global styling and layout theme
│  ├─ package.json           # Node dependencies and scripts
│  └─ Dockerfile             # Frontend container definition
├─ docker-compose.yml        # Local multi-service orchestration
└─ README.md                 # Project documentation
```

### Quick start

1. **Backend**
   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

2. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev -- --host 0.0.0.0`

3. Open `http://127.0.0.1:5173`

### Run with Docker

- `docker compose up --build`
