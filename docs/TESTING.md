# Testing Guide

## Overview

| Layer | Framework | Runner |
|-------|-----------|--------|
| Backend | Jest + Supertest | `ts-jest` |
| Frontend | Vitest + Testing Library | `jsdom` environment |

All tests are **offline** — no Supabase connection required. Auth guards and middleware are tested via HTTP; components are tested in a mocked browser environment.

---

## Running Tests

### Backend

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Coverage output goes to `backend/coverage/`. The `lcov` report can be opened with any coverage browser (e.g. VS Code Coverage Gutters).

### Frontend

```bash
cd frontend

# Run all tests (watch mode)
npm test

# Run once with coverage report
npm run test:coverage
```

Coverage output goes to `frontend/coverage/`.

---

## Backend Tests (`backend/src/__tests__/`)

All backend tests use **Supertest** against a real Express app instance (`createApp()`). No database is touched — every test either hits a public endpoint or verifies that an auth guard blocks the request before any DB call is made.

### `health.test.ts`

| Test | What it checks |
|------|----------------|
| `GET /health` | Returns 200 with `{ status: "ok", timestamp }` |
| `GET /api/v1` | Returns API info and name |
| No token on `/api/v1/buyers` | Returns 401 |
| Malformed token on `/api/v1/buyers` | Returns 401 |
| Login missing email | Returns 400 |
| Login missing password | Returns 400 |

### `crud-validation.test.ts`

Verifies every protected endpoint rejects unauthenticated requests:

- **7 protected GETs** — `/buyers`, `/sellers`, `/renters`, `/loan-clients`, `/stats`, `/stats/recent-activity`, `/users` → all return 401
- **4 protected POSTs** — `/buyers`, `/sellers`, `/renters`, `/loan-clients` → all return 401
- **Export endpoints** — `/export/buyers/pdf` and `/export/buyers/csv` → return 401
- **File endpoints** — `POST /files/upload`, `GET /files/entity/buyer/some-id` → return 401
- **404 handler** — unknown route returns `{ status: "error" }` with 404
- **Login validation** — empty body, email only, password only all return 400

### `middleware.test.ts`

Focuses on the auth middleware's token format handling:

| Test | Scenario |
|------|----------|
| Empty Authorization header | 401 |
| Header without `Bearer ` prefix | 401 |
| `Bearer ` with empty token | 401 |
| `Bearer aaa.bbb.ccc` (invalid JWT) | 401 |
| CORS header on health check | `access-control-allow-origin` present |
| JSON Content-Type on 404 | Response body has `status: "error"` |

### `stats-service.test.ts`

| Test | Scenario |
|------|----------|
| `GET /stats` without token | 401 + `status: "error"` |
| `GET /stats/recent-activity` without token | 401 + `status: "error"` |
| Export unknown entity + bad token | 401 (not 500 — server doesn't crash) |
| CSV export unknown entity + bad token | 401 (not 500) |

---

## Frontend Tests (`frontend/src/__tests__/`)

All frontend tests use **Vitest** with the `jsdom` environment. Network calls are mocked with `vi.mock()`.

### `setup.ts`

Imports `@testing-library/jest-dom` to extend Vitest's `expect` with matchers like `toBeInTheDocument()`, `toHaveValue()`, etc.

### `buyer-form.test.tsx`

Tests the `BuyerForm` component in isolation. No mocks needed — the form is pure UI.

| Test | What it checks |
|------|----------------|
| No `buyer` prop | Renders "Add New Buyer" title |
| `buyer` prop provided | Renders "Edit Buyer" title |
| Submit with empty name | Shows "Name is required" |
| Submit with name but no phone | Shows "Phone number is required" |
| Submit with both required fields | Calls `onSubmit` with `{ name, phoneNumber }` |
| Cancel button | Calls `onCancel` |

### `data-table.test.tsx`

Tests the generic `DataTable` component's rendering and interactions.

### `login-page.test.tsx`

Mocks: `useAuth` hook, `authService.login`, `useNavigate`.

| Test | What it checks |
|------|----------------|
| Initial render | Email input, password input, Sign In button all present |
| Submit with empty fields | Shows "email and password are required" |
| Submit with non-email string | Shows "valid email address" |
| Submit with valid credentials | Calls `authService.login(email, password)` |
| Login API throws | Shows the error message from the rejection |

### `detail-drawer.test.tsx`

Mocks the `file-upload` component. Tests the `DetailDrawer` slide-in panel.

| Test | What it checks |
|------|----------------|
| Title and subtitle | Both rendered |
| Field labels | All configured labels present |
| Field values | Values displayed correctly |
| Null field | Displays `—` |
| FileUploadSection | Rendered with correct entity props |
| Backdrop click | Calls `onClose` |
| Escape key | Calls `onClose` |
| Edit button | Calls `onEdit` |
| Close button | Calls `onClose` |
| No `onEdit` prop | Edit button absent |

---

## Coverage Configuration

### Backend (`jest.config.js`)

```javascript
collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**', '!src/server.ts']
```

Excludes test files themselves and the server entry point (which just calls `listen()`).

### Frontend (`vite.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  exclude: ['node_modules/', 'src/__tests__/', 'src/main.tsx', 'src/vite-env.d.ts'],
}
```

---

## CI Integration

Tests run automatically via GitHub Actions on every push to `main`/`develop` and every PR targeting `main`.

**Backend job steps:**
1. `npm ci`
2. `tsc --noEmit` (type check)
3. `npm run test:coverage`
4. Upload `backend/coverage/` as artifact

**Frontend job steps:**
1. `npm ci`
2. `npm run lint`
3. `tsc --noEmit` (type check)
4. `npm run test:coverage`
5. `npm run build`
6. Upload `frontend/coverage/` as artifact

See `.github/workflows/ci.yml` for the full workflow definition.

---

## Adding New Tests

### Backend — new endpoint

Add a test to `crud-validation.test.ts` that asserts the endpoint returns 401 without a token. No additional mocking is needed.

```typescript
it('GET /api/v1/my-new-resource returns 401 without token', async () => {
  const res = await request(app).get('/api/v1/my-new-resource')
  expect(res.status).toBe(401)
})
```

### Frontend — new form component

Follow the `buyer-form.test.tsx` pattern: render the component with `vi.fn()` for callbacks, assert labels, trigger submit, assert validation errors, assert callback called on valid submit.

### Frontend — new page with API call

Follow the `login-page.test.tsx` pattern: mock the service module with `vi.mock()`, import the mocked function with `vi.mocked()`, assert it was called (or not called) with the expected arguments.
