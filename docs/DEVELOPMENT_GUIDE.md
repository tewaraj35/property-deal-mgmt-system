# Development Guide

## First-Time Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier is sufficient)

### 1. Clone and install

```bash
git clone <repo-url>
cd nesh-property-system

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env.local

# Frontend
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env.local` with your Supabase credentials (see [DEPLOYMENT.md](DEPLOYMENT.md) for the full variable list).

Set `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Apply the database schema

Open your Supabase project → **SQL Editor**, paste and run the full contents of [docs/DATABASE_MIGRATIONS.sql](DATABASE_MIGRATIONS.sql).

### 4. Create the first admin user

In Supabase → **Authentication → Users** → Invite user, then run in the SQL Editor:
```sql
INSERT INTO public.users (id, email, full_name, role, status)
VALUES ('<supabase-auth-uid>', 'admin@yourdomain.com', 'Admin', 'SUPER_ADMIN', 'ACTIVE');
```

### 5. Create the file storage bucket

Supabase → **Storage** → New bucket → name it `entity-files` → set to **private**.

### 6. Start the dev servers

```bash
# Terminal 1
cd backend && npm run dev
# → http://localhost:5000

# Terminal 2
cd frontend && npm run dev
# → http://localhost:5173
```

---

## Day-to-Day Workflow

```bash
# Backend hot reload (ts-node-dev)
cd backend && npm run dev

# Frontend Vite HMR
cd frontend && npm run dev

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Type check both sides without running tests
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

When you change `backend/src/types/index.ts`, mirror the same change in `frontend/src/types/index.ts` — the two files are kept in sync manually.

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files and folders | kebab-case | `buyer-form.tsx`, `auth-routes.ts` |
| React components | PascalCase (name) / kebab-case (file) | `BuyerForm` in `buyer-form.tsx` |
| Functions and variables | camelCase | `fetchBuyerData`, `agentId` |
| Constants / env vars | UPPER_SNAKE_CASE | `API_BASE_URL`, `JWT_SECRET` |
| DB tables and columns | snake_case | `loan_clients`, `agent_id` |
| API routes | `/api/v1/kebab-case` | `/api/v1/loan-clients` |
| TypeScript interfaces | PascalCase | `interface Buyer`, `enum BuyerStatus` |
| Boolean helpers | `is`/`has`/`can` prefix | `isAdmin()`, `hasAccess()` |

---

## Adding a New Entity Module

The four existing modules (buyers, sellers, renters, loan-clients) all follow the same pattern. Use buyers as the reference implementation and copy these steps.

### Backend — 5 files

**1. Add types** (`backend/src/types/index.ts`)

```typescript
export enum WidgetStatus {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface Widget {
  id: string;
  agentId: string;
  name: string;
  phoneNumber: string;
  // ... other fields
  status: WidgetStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetDTO {
  name: string;
  phoneNumber: string;
  // ... optional fields
  status?: WidgetStatus;
  notes?: string;
}

export type UpdateWidgetDTO = Partial<CreateWidgetDTO>;
```

**2. Create the service** (`backend/src/services/widget-service.ts`)

Copy `buyer-service.ts`. Change:
- Table name: `buyers` → `widgets`
- Map function: `mapBuyer` → `mapWidget`
- All field mappings to match your DB columns
- Status enum: `BuyerStatus` → `WidgetStatus`
- Export name: `buyerService` → `widgetService`

**3. Create the controller** (`backend/src/controllers/widget-controller.ts`)

Copy `buyer-controller.ts`. Change:
- Import: `buyerService` → `widgetService`
- All method names: `getAllBuyers` → `getAllWidgets`, etc.
- Required field validation in `createWidget` to match your fields
- Export name: `buyerController` → `widgetController`

**4. Create the routes** (`backend/src/routes/widget-routes.ts`)

Copy `buyer-routes.ts`. Change:
- Import: `buyerController` → `widgetController`
- RBAC delete rule: ADMIN+ (keep same pattern)

**5. Register the route** (`backend/src/app.ts`)

```typescript
import widgetRoutes from './routes/widget-routes';
// ...
app.use('/api/v1/widgets', widgetRoutes);
```

### Backend — add to export controller

In `backend/src/controllers/export-controller.ts`, add an entry to the `ENTITY_CONFIGS` map:

```typescript
widgets: {
  table: 'widgets',
  columns: ['name', 'phone_number', 'status', 'notes'],
  headers: ['Name', 'Phone', 'Status', 'Notes'],
  title: 'Widgets Report',
},
```

### Database

Add the table to `docs/DATABASE_MIGRATIONS.sql` and run it in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  -- your other columns --
  status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp
CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own widgets" ON public.widgets
  FOR ALL USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
```

### Frontend — 4 files

**1. Add types** (`frontend/src/types/index.ts`)

Mirror the same enums and interfaces you added to the backend types file.

**2. Add the service** (`frontend/src/services/crud-services.ts`)

Append a new service object following the existing pattern:

```typescript
export const widgetService = {
  getAll: (page = 1, limit = 50, status?: string, dateFrom?: string, dateTo?: string) =>
    makeListRequest<Widget>(`/widgets?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${dateParams(dateFrom, dateTo)}`),

  getById: (id: string) => makeRequest<Widget>('get', `/widgets/${id}`),
  create: (data: CreateWidgetDTO) => makeRequest<Widget>('post', '/widgets', data),
  update: (id: string, data: Partial<CreateWidgetDTO>) => makeRequest<Widget>('put', `/widgets/${id}`, data),
  delete: (id: string) => makeRequest('delete', `/widgets/${id}`),
  search: (query: string, limit = 20) =>
    makeRequest<Widget[]>('get', `/widgets/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};
```

**3. Create the form** (`frontend/src/components/forms/widget-form.tsx`)

Copy `buyer-form.tsx`. Change field names, labels, and the status `<select>` options to match `WidgetStatus`.

**4. Create the page** (`frontend/src/pages/widgets-page.tsx`)

Copy `buyers-page.tsx`. Change:
- Import `widgetService`, `Widget`, `WidgetStatus`, `WidgetForm`
- Column config passed to `DataTable`
- `DetailDrawer` fields array
- Status filter options

**5. Register the route** (`frontend/src/App.tsx`)

```typescript
import WidgetsPage from './pages/widgets-page'
// inside <Routes>:
<Route path="/widgets" element={<LayoutRoute><WidgetsPage /></LayoutRoute>} />
```

**6. Add to sidebar** (`frontend/src/components/layout/main-layout.tsx`)

Add an entry to the nav links array following the existing pattern.

---

## Key Patterns

### Backend: RBAC filter in a controller

Agents always get filtered to their own rows; admins see everything. This is the standard pattern used in every controller:

```typescript
const agentFilter = req.context.userRole === 'AGENT' ? req.context.userId : undefined;
const result = await widgetService.getAllWidgets(agentFilter, ...);
```

### Backend: standard response shape

All controllers return the same envelope. Use this exact structure:

```typescript
// Success (single)
res.status(201).json({
  status: 'success',
  data: widget,
  meta: { timestamp: new Date().toISOString(), requestId: (req as any).id },
});

// Error
res.status(400).json({
  status: 'error',
  error: { code: 'INVALID_INPUT', message: 'Name is required' },
});
```

### Backend: audit log

Every mutation (create/update/delete) should write an audit entry via `createAuditLog` from `supabase-service.ts`:

```typescript
import { createAuditLog } from './supabase-service';

await createAuditLog(userId, 'CREATE', 'widgets', widget.id);
await createAuditLog(userId, 'UPDATE', 'widgets', widgetId, oldValues, newValues);
await createAuditLog(userId, 'DELETE', 'widgets', widgetId);
```

### Frontend: API client helpers

`frontend/src/utils/api-client.ts` exports two helpers that handle the response envelope automatically:

```typescript
// Single record — unwraps data field
const widget = await makeRequest<Widget>('post', '/widgets', body);

// List — unwraps data + returns meta for pagination
const { data, total, page, limit } = await makeListRequest<Widget>('/widgets?page=1');
```

### Frontend: toast notifications

Use the `useToast` hook from `components/common/toast.tsx` for user feedback:

```typescript
const { showSuccess, showError } = useToast();
showSuccess('Widget created');
showError('Failed to create widget');
```

---

## Environment Variables

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full variable reference.

The backend validates all required variables at startup via `backend/src/utils/env-config.ts`. If a required variable is missing, the process exits with a clear error message before accepting any requests.

---

## Common Issues

**`SUPABASE_JWT_SECRET` mismatch** — if the backend returns 401 on valid tokens, double-check that `SUPABASE_JWT_SECRET` in `.env.local` matches the JWT secret in Supabase Dashboard → Project Settings → API → JWT Settings.

**CORS errors in browser** — the `FRONTEND_URL` in `backend/.env.local` must match the origin the browser uses exactly (including port). For local dev: `http://localhost:5173`.

**RLS blocking admin queries** — Supabase service role key bypasses RLS. Make sure the backend always uses `supabaseAdmin` (the service role client), not the anon client, for all server-side queries.

**TypeScript `req.context` errors** — `req.context` is injected by `authMiddleware`. If TypeScript complains, check that `backend/src/types/index.ts` has the `RequestContext` interface declared and that `express` Request is augmented there.
