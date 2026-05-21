# System Architecture

## Overview

Nesh Property Management System is a three-tier web application:

```
Browser (React SPA)
      ↕  HTTPS / JSON
Express API (Node.js)
      ↕  Supabase client SDK
Supabase (PostgreSQL + Storage)
```

All three tiers enforce the same RBAC rules: the UI hides controls, the API rejects unauthorized requests, and the database enforces Row-Level Security policies.

---

## Technology Choices

| Concern | Choice | Why |
|---------|--------|-----|
| Frontend framework | React 18 + Vite | Fast HMR, React Server Components ready |
| Frontend language | TypeScript (strict) | Shared types with backend, compile-time safety |
| Styling | Tailwind CSS | Utility-first, consistent design tokens |
| State management | Zustand | Minimal boilerplate, TypeScript-native |
| HTTP client | Axios | Interceptors for auth token injection |
| Form handling | React Hook Form + Zod | Performant, schema-validated forms |
| Backend framework | Express 5 | Mature, async-native in v5 |
| Database | Supabase (PostgreSQL) | Managed Postgres + auth + storage + RLS |
| Auth | Supabase Auth + JWT | Handles password hashing, sessions; JWT for stateless API auth |
| File storage | Supabase Storage | Co-located with DB, integrated access control |
| PDF generation | PDFKit | Server-side, no headless browser required |
| Testing (frontend) | Vitest + Testing Library | Native ESM support, fast, compatible with Vite |
| Testing (backend) | Jest + Supertest | Widely used, ts-jest for TypeScript |
| Containerisation | Docker + Nginx | Multi-stage builds, Nginx for SPA routing |

---

## Request Lifecycle

```
1. Browser makes request with Authorization: Bearer <jwt>
2. Express auth middleware:
   a. Extracts token from header
   b. Verifies JWT signature (SUPABASE_JWT_SECRET)
   c. Attaches { userId, userRole, email } to req.context
3. Route handler calls controller
4. Controller calls service with req.context
5. Service builds Supabase query:
   - AGENT: adds .eq('agent_id', userId) filter
   - ADMIN/SUPER_ADMIN: no agent filter
6. Supabase enforces RLS policies as a second safety layer
7. Service maps snake_case DB columns → camelCase TypeScript
8. Controller wraps result in standard { status, data, meta } envelope
9. Error handler catches any throw and returns { status: 'error', error: { code, message } }
```

---

## Folder Structure (as built)

### Backend (`backend/src/`)

```
app.ts                    Express app factory (createApp())
server.ts                 HTTP server entry point

middleware/
  auth.ts                 JWT verification → req.context; RBAC role check
  error-handler.ts        Global catch-all; 404 handler

routes/
  auth-routes.ts          /api/v1/auth/*
  buyer-routes.ts         /api/v1/buyers/*
  seller-routes.ts        /api/v1/sellers/*
  renter-routes.ts        /api/v1/renters/*
  loan-client-routes.ts   /api/v1/loan-clients/*
  file-upload-routes.ts   /api/v1/files/*
  stats-routes.ts         /api/v1/stats/*
  export-routes.ts        /api/v1/export/*
  user-management-routes.ts /api/v1/users/*

controllers/              Thin layer — validate input, call service, shape response
  auth-controller.ts
  buyer-controller.ts
  seller-controller.ts
  renter-controller.ts
  loan-client-controller.ts
  file-upload-controller.ts
  stats-controller.ts
  export-controller.ts
  user-management-controller.ts

services/                 All database logic lives here
  supabase-service.ts     Supabase client singleton + createAuditLog helper
  auth-service.ts         Login, password change, JWT generation
  buyer-service.ts        Buyer CRUD + search
  seller-service.ts       Seller CRUD + search
  renter-service.ts       Renter CRUD + search
  loan-client-service.ts  Loan client CRUD + search
  file-upload-service.ts  Supabase Storage operations
  stats-service.ts        Aggregate queries, recent activity
  user-management-service.ts User admin operations

types/
  index.ts                All shared TypeScript interfaces + enums

utils/
  env-config.ts           Validates + exports all env vars at startup

__tests__/
  health.test.ts
  crud-validation.test.ts
  middleware.test.ts
  stats-service.test.ts
```

### Frontend (`frontend/src/`)

```
App.tsx                   Root router — all routes declared here
main.tsx                  React DOM entry point

pages/
  login-page.tsx          Email/password login form
  dashboard-page.tsx      Stat cards + recent activity widget
  buyers-page.tsx         Full CRUD — list, add, edit, delete, view, export
  sellers-page.tsx        (same pattern)
  renters-page.tsx        (same pattern)
  loan-clients-page.tsx   (same pattern)
  users-page.tsx          Admin-only user management

components/
  protected-route.tsx     Redirects unauthenticated or unauthorised users
  layout/
    main-layout.tsx       Sidebar navigation + top bar
  common/
    data-table.tsx        Generic paginated table (view/edit/delete actions)
    detail-drawer.tsx     Slide-in panel with full record + file attachments
    file-upload.tsx       Upload, list, download, delete attachments
    toast.tsx             Toast notification provider + hook
  forms/
    buyer-form.tsx        9-field buyer form with validation
    seller-form.tsx       8-field seller form
    renter-form.tsx       7-field renter form
    loan-client-form.tsx  7-field loan client form

hooks/
  use-auth.ts             Reads/writes Zustand auth store; exposes isAdmin helper

services/
  auth-service.ts         login(), logout(), getProfile()
  crud-services.ts        buyerService, sellerService, renterService, loanClientService
  export-service.ts       downloadPdf(), downloadCsv()
  stats-service.ts        getDashboardStats(), getRecentActivity()
  user-service.ts         User management API calls

stores/
  auth-store.ts           Zustand store: user, token, isLoading

types/
  index.ts                Shared types (mirrors backend types/index.ts)

utils/
  api-client.ts           Axios instance with base URL + auth interceptor
  env-config.ts           Typed environment variables

styles/
  globals.css             Tailwind base + custom component classes

__tests__/
  setup.ts                @testing-library/jest-dom import
  buyer-form.test.tsx
  data-table.test.tsx
  detail-drawer.test.tsx
  login-page.test.tsx
```

---

## Database Schema

7 tables in Supabase PostgreSQL. See [DATABASE_MIGRATIONS.sql](DATABASE_MIGRATIONS.sql) for the full schema.

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `users` | Staff accounts | `id`, `email`, `full_name`, `role`, `status` |
| `buyers` | Buyer leads | `agent_id`, `name`, `phone_number`, `status`, `follow_up_date` |
| `sellers` | Seller leads | `agent_id`, `name`, `property_details`, `status` |
| `renters` | Rental records | `agent_id`, `tenant_name`, `property_address`, `monthly_rent`, `status` |
| `loan_clients` | Loan applications | `agent_id`, `client_name`, `loan_amount`, `bank_name`, `status` |
| `audit_logs` | Change history | `user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values` |
| `file_uploads` | Attachment metadata | `entity_type`, `entity_id`, `file_path`, `mime_type` |

All entity tables have:
- `id` (UUID primary key)
- `agent_id` (FK → users, for RBAC)
- `deleted_at` (soft delete — NULL means active)
- `created_at`, `updated_at` (auto-managed by trigger)

### Row-Level Security

Supabase RLS policies mirror the API-level RBAC:
- Agents can only SELECT/INSERT/UPDATE rows where `agent_id = auth.uid()`
- Admins and Super Admins bypass the `agent_id` filter via role check in the policy

---

## Authentication & Authorization

### Login Flow

```
POST /api/v1/auth/login  { email, password }
  → authService.login()
  → supabase.auth.signInWithPassword()
  → verify user in public.users table
  → sign JWT with SUPABASE_JWT_SECRET
  → return { user: {...}, tokens: { accessToken } }

Frontend stores accessToken in localStorage + Zustand.
Axios interceptor attaches header:  Authorization: Bearer <token>
```

### JWT Payload

```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "role": "AGENT",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### RBAC Enforcement Points

1. **Database** — RLS policies (always enforced, regardless of API)
2. **API middleware** — `authMiddleware` in `backend/src/middleware/auth.ts`
3. **Frontend routing** — `ProtectedRoute` component checks `requiredRoles`
4. **Frontend UI** — buttons/actions conditionally rendered based on `isAdmin`

---

## Standard API Response Envelope

All endpoints return this shape:

```json
// Success
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-21T10:00:00.000Z",
    "requestId": "uuid"
  }
}

// Success (list)
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "timestamp": "...",
    "requestId": "...",
    "page": 1,
    "total": 45,
    "limit": 20
  }
}

// Error
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files & folders | kebab-case | `buyer-form.tsx`, `auth-routes.ts` |
| React components | PascalCase (name) / kebab-case (file) | `BuyerForm` in `buyer-form.tsx` |
| Functions & variables | camelCase | `fetchBuyerData()`, `userData` |
| Constants / env vars | UPPER_SNAKE_CASE | `API_BASE_URL`, `JWT_SECRET` |
| DB tables & columns | snake_case | `loan_clients`, `agent_id` |
| API routes | `/api/v1/kebab-case` | `/api/v1/loan-clients` |
| TypeScript interfaces | PascalCase | `interface Buyer`, `enum BuyerStatus` |
| Boolean functions | `is`/`has`/`can` prefix | `isAdmin()`, `hasAccess()` |

---

## Security Layers

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS in production (nginx terminates TLS) |
| Authentication | Supabase Auth (password hashing) + JWT verification |
| Authorisation | RBAC middleware + RLS policies |
| Input validation | TypeScript types + controller validation |
| Secrets | Backend `.env.local` only — never in frontend bundle |
| Audit | Every mutation writes an audit_log row |
| Soft deletes | Records are never hard-deleted — deleted_at set instead |
| File safety | MIME type whitelist + 10 MB size limit |
