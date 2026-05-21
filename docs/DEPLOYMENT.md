# Deployment Guide

---

## Environment Variables

Copy the example files before starting either the backend or frontend:

```bash
cp backend/.env.example  backend/.env.local
cp frontend/.env.example frontend/.env.local
```

### Backend (`backend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Default `5000` |
| `SUPABASE_URL` | Yes | From Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (never expose to frontend) |
| `SUPABASE_JWT_SECRET` | Yes | From Supabase Dashboard → Project Settings → API → JWT Settings |
| `JWT_SECRET` | Yes | Your own signing secret — generate with `openssl rand -hex 32` |
| `JWT_TOKEN_EXPIRY` | No | Default `7d` |
| `FRONTEND_URL` | Yes | CORS allow-list — `http://localhost:5173` in dev |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL, e.g. `http://localhost:5000/api/v1` |
| `VITE_SUPABASE_URL` | No | Only needed if frontend calls Supabase directly |
| `VITE_SUPABASE_ANON_KEY` | No | Only needed if frontend calls Supabase directly |

> **Never commit `.env.local` files.** They are listed in `.gitignore`.

---

## Local Development

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm install && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm install && npm run dev
```

The Vite dev server proxies are **not** configured — the frontend calls the backend directly via `VITE_API_URL`. Make sure both are running.

---

## Production with Docker

### Prerequisites
- Docker 24+ and Docker Compose v2
- A `.env` file at the project root (or export variables in your shell)

### Environment File (project root `.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# Auth
JWT_SECRET=your-production-jwt-secret

# CORS — set to your actual domain in production
FRONTEND_URL=https://yourdomain.com

# Frontend build arg
VITE_API_URL=https://yourdomain.com/api/v1
```

### Build and Start

```bash
# Build images and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Service Details

| Service | Port | Notes |
|---------|------|-------|
| `backend` | 5000 | Node.js, health check at `/health` |
| `frontend` | 80 | Nginx, serves the React SPA |

### Health Check

The backend container has a built-in health check:
```
GET http://localhost:5000/health
→ { "status": "ok", "timestamp": "...", "uptime": ... }
```

Docker will restart the backend container automatically if the health check fails 3 times in a row.

### Frontend — SPA Routing

The Nginx config (`frontend/nginx.conf`) uses `try_files $uri $uri/ /index.html` so React Router handles all client-side navigation correctly. Static assets (JS, CSS, images) are served with a 1-year `Cache-Control: immutable` header.

---

## Supabase Setup

Before first run, you must apply the database schema.

1. Open your Supabase project → **SQL Editor**
2. Paste and run the contents of `docs/DATABASE_MIGRATIONS.sql`
3. Create the first Super Admin user:
   - Go to **Authentication → Users** → Invite user
   - Then run in SQL Editor:
     ```sql
     INSERT INTO public.users (id, email, full_name, role, status)
     VALUES ('<supabase-auth-uid>', 'admin@yourdomain.com', 'Admin', 'SUPER_ADMIN', 'ACTIVE');
     ```
4. Enable the `entity-files` storage bucket:
   - Go to **Storage** → New bucket → name it `entity-files` → set to **private**

---

## CI/CD — GitHub Actions

The workflow lives at `.github/workflows/ci.yml` and runs on:
- Every push to `main` or `develop`
- Every pull request targeting `main`

### Jobs

**`backend`**
1. Install dependencies (`npm ci`)
2. Type check (`tsc --noEmit`)
3. Run tests with coverage (`npm run test:coverage`)
4. Upload coverage report as artifact

**`frontend`**
1. Install dependencies (`npm ci`)
2. Lint (`npm run lint`)
3. Type check (`tsc --noEmit`)
4. Run tests with coverage (`npm run test:coverage`)
5. Build (`npm run build`)
6. Upload coverage report as artifact

### Required GitHub Secrets

Add these in your repo → **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_JWT_SECRET` | JWT signing secret |
| `JWT_SECRET` | Your own JWT secret |

---

## Production Checklist

- [ ] `.env.local` / `.env` files filled in with production values
- [ ] Database schema applied (`DATABASE_MIGRATIONS.sql`)
- [ ] `entity-files` storage bucket created in Supabase
- [ ] First Super Admin user inserted
- [ ] `FRONTEND_URL` set to your production domain (for CORS)
- [ ] `VITE_API_URL` set to your backend's public URL
- [ ] GitHub Secrets configured for CI
- [ ] Docker images build successfully (`docker compose build`)
- [ ] Health check passes (`curl http://localhost:5000/health`)
- [ ] Firewall / reverse proxy configured (if self-hosting)
