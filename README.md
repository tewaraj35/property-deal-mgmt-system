# Nesh Property Management System

A full-stack property CRM built with React 18, Node.js/Express, TypeScript, and Supabase. Manages buyers, sellers, renters, and loan clients with role-based access control, audit logging, file attachments, and PDF/CSV exports.

---

## Quick Start

You need two terminals running simultaneously.

**Terminal 1 — Backend**
```bash
cd backend
cp .env.example .env.local   # fill in your Supabase credentials
npm install
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
cp .env.example .env.local   # set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
nesh-property-system/
├── backend/              Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/       API route handlers
│   │   ├── controllers/  Request/response handling
│   │   ├── services/     Database operations (Supabase)
│   │   ├── middleware/   Auth, RBAC, error handling
│   │   ├── types/        TypeScript definitions
│   │   └── utils/        Config, helpers
│   ├── Dockerfile
│   └── jest.config.js
├── frontend/             React 18 + Vite + TypeScript SPA
│   ├── src/
│   │   ├── pages/        Route-level page components
│   │   ├── components/   Reusable UI components
│   │   ├── services/     API client wrappers
│   │   ├── hooks/        Custom React hooks
│   │   ├── stores/       Zustand state management
│   │   ├── types/        TypeScript definitions
│   │   └── utils/        Config, helpers
│   ├── Dockerfile
│   └── nginx.conf
├── docs/                 Full project documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── DATABASE_MIGRATIONS.sql
├── .github/workflows/    CI/CD (GitHub Actions)
└── docker-compose.yml    Production container setup
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, tech decisions |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | All 35+ API endpoints with params and responses |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, CI/CD, environment variables |
| [docs/TESTING.md](docs/TESTING.md) | Running tests and coverage |
| [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | Local setup, conventions, adding new modules |
| [docs/DATABASE_MIGRATIONS.sql](docs/DATABASE_MIGRATIONS.sql) | Full PostgreSQL schema |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Zustand |
| Backend | Node.js, Express 5, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT |
| File Storage | Supabase Storage |
| PDF Export | PDFKit |
| Testing | Vitest (frontend), Jest + Supertest (backend) |
| CI/CD | GitHub Actions |
| Deployment | Docker + Nginx |

---

## Features

- **4 CRM modules** — Buyers, Sellers, Renters, Loan Clients
- **RBAC** — Super Admin / Admin / Agent with row-level enforcement at DB, API, and UI layers
- **Full CRUD** — paginated lists, search, status filter, date-range filter
- **Detail drawer** — slide-in panel with full record info and file attachments
- **File attachments** — upload/download/delete per record (PDF, Word, Excel, Images)
- **Exports** — PDF and CSV for all 4 modules
- **Dashboard** — live stats per module + recent activity feed
- **Audit logging** — every create/update/delete is recorded
- **User management** — admin UI for managing team accounts

---

## Roles & Permissions

| Action | AGENT | ADMIN | SUPER_ADMIN |
|--------|-------|-------|-------------|
| View own records | ✅ | ✅ | ✅ |
| View all records | ✗ | ✅ | ✅ |
| Create records | ✅ | ✅ | ✅ |
| Edit records | Own only | All | All |
| Delete records | ✗ | ✅ | ✅ |
| Manage users | ✗ | Limited | ✅ |

---

## Commands

```bash
# Development
npm run dev          # Start with hot reload

# Testing
npm test             # Run tests
npm run test:coverage # Run with coverage report

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled output

# Docker (from project root)
docker compose up --build   # Build and start all services
docker compose down         # Stop all services
```
