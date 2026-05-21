# API Reference

Base URL: `http://localhost:5000/api/v1`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Response Format

### Success
```json
{
  "status": "success",
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

### Success (list)
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": { "timestamp": "...", "requestId": "...", "page": 1, "total": 45, "limit": 20 }
}
```

### Error
```json
{
  "status": "error",
  "error": { "code": "UNAUTHORIZED", "message": "No token provided" }
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Valid token but insufficient role |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Health

### `GET /health`
No auth required.

**Response**
```json
{ "status": "ok", "timestamp": "2026-05-21T10:00:00Z", "uptime": 1234.5 }
```

### `GET /api/v1`
No auth required. Returns API info and endpoint list.

---

## Auth — `/api/v1/auth`

### `POST /api/v1/auth/login`
No auth required.

**Body**
```json
{ "email": "admin@nesh.com", "password": "secret" }
```

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "ADMIN", "status": "ACTIVE" },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

---

### `POST /api/v1/auth/logout`
Auth required.

**Response `200`** — `{ "status": "success", "data": { "message": "Logged out" } }`

---

### `GET /api/v1/auth/profile`
Auth required. Returns the current user's profile.

---

### `PATCH /api/v1/auth/profile`
Auth required.

**Body** — any subset of `{ fullName, phoneNumber }`

---

### `POST /api/v1/auth/change-password`
Auth required.

**Body**
```json
{ "currentPassword": "old", "newPassword": "new" }
```

---

### `POST /api/v1/auth/refresh-token`
Auth required.

**Response** — new `accessToken`

---

## Buyers — `/api/v1/buyers`

All endpoints require auth. Agents see only their own buyers; Admins see all.

### `GET /api/v1/buyers`

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 20, max: 100) |
| `status` | string | Filter by status: `NEW`, `ACTIVE`, `CONVERTED`, `LOST`, `INACTIVE` |
| `dateFrom` | date | Filter created_at >= `YYYY-MM-DD` |
| `dateTo` | date | Filter created_at <= `YYYY-MM-DD` |

**Response** — paginated list of Buyer objects

---

### `GET /api/v1/buyers/search`

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | **Required.** Search across name, email, phone_number |
| `limit` | number | Max results (default: 20) |

---

### `GET /api/v1/buyers/:id`
Returns single buyer. Agents can only access their own.

---

### `POST /api/v1/buyers`

**Body**
```json
{
  "name": "Alice Wong",           // required
  "phoneNumber": "0123456789",    // required
  "email": "alice@example.com",
  "location": "Kuala Lumpur",
  "propertyOfInterest": "3-bedroom condo",
  "leadSource": "Facebook",
  "followUpDate": "2026-06-01",
  "status": "NEW",
  "notes": "Prefers weekday calls"
}
```

**Response `201`** — created Buyer object

---

### `PUT /api/v1/buyers/:id`
Agents can only update their own buyers. Body is same shape as POST (all fields optional).

---

### `DELETE /api/v1/buyers/:id`
Admin+ only. Soft delete — sets `deleted_at`.

---

## Sellers — `/api/v1/sellers`

Same pattern as Buyers. Status values: `NEW`, `ACTIVE`, `SOLD`, `LOST`, `INACTIVE`.

**Seller-specific fields in POST/PUT body:**
```json
{
  "name": "Bob Tan",
  "phoneNumber": "0187654321",
  "email": "bob@example.com",
  "location": "Petaling Jaya",
  "propertyDetails": "Double-storey semi-D, 2200 sqft",
  "leadSource": "Referral",
  "followUpDate": "2026-06-15",
  "status": "ACTIVE",
  "notes": ""
}
```

Endpoints: `GET /sellers`, `GET /sellers/search`, `GET /sellers/:id`, `POST /sellers`, `PUT /sellers/:id`, `DELETE /sellers/:id`

---

## Renters — `/api/v1/renters`

Status values: `ACTIVE`, `INACTIVE`, `EVICTED`, `MOVED_OUT`.

**Renter-specific fields:**
```json
{
  "tenantName": "Carol Lim",
  "propertyAddress": "No. 5, Jalan Bukit...",
  "monthlyRent": 2500,
  "rentDueDate": "2026-06-05",
  "tenantContact": "0112233445",
  "status": "ACTIVE",
  "notes": ""
}
```

Endpoints: `GET /renters`, `GET /renters/search`, `GET /renters/:id`, `POST /renters`, `PUT /renters/:id`, `DELETE /renters/:id`

---

## Loan Clients — `/api/v1/loan-clients`

Status values: `NEW`, `PROCESSING`, `APPROVED`, `REJECTED`, `CLOSED`.

**Loan client-specific fields:**
```json
{
  "clientName": "David Ng",
  "income": 8000,
  "loanType": "Home Loan",
  "loanAmount": 450000,
  "bankName": "Maybank",
  "bankerName": "Sarah",
  "status": "PROCESSING",
  "notes": ""
}
```

Endpoints: `GET /loan-clients`, `GET /loan-clients/search`, `GET /loan-clients/:id`, `POST /loan-clients`, `PUT /loan-clients/:id`, `DELETE /loan-clients/:id`

---

## Stats — `/api/v1/stats`

Auth required.

### `GET /api/v1/stats`
Returns total count and count-by-status for all 4 modules.
Agents see only their own records; Admins see all.

**Response**
```json
{
  "status": "success",
  "data": {
    "buyers":      { "total": 42, "byStatus": { "NEW": 10, "ACTIVE": 25, "CONVERTED": 7 } },
    "sellers":     { "total": 18, "byStatus": { "ACTIVE": 12, "SOLD": 6 } },
    "renters":     { "total": 30, "byStatus": { "ACTIVE": 28, "INACTIVE": 2 } },
    "loanClients": { "total": 15, "byStatus": { "PROCESSING": 8, "APPROVED": 7 } }
  }
}
```

---

### `GET /api/v1/stats/recent-activity`
Returns the 15 most recent audit log entries for the current user (or all entries for Admins).

**Response**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "CREATE",
      "table_name": "buyers",
      "record_id": "uuid",
      "created_at": "2026-05-21T09:30:00Z"
    }
  ]
}
```

---

## Export — `/api/v1/export`

Auth required. Agents export only their own data; Admins export all.

| Endpoint | Response |
|----------|----------|
| `GET /api/v1/export/buyers/pdf` | `application/pdf` download |
| `GET /api/v1/export/buyers/csv` | `text/csv` download |
| `GET /api/v1/export/sellers/pdf` | `application/pdf` download |
| `GET /api/v1/export/sellers/csv` | `text/csv` download |
| `GET /api/v1/export/renters/pdf` | `application/pdf` download |
| `GET /api/v1/export/renters/csv` | `text/csv` download |
| `GET /api/v1/export/loan-clients/pdf` | `application/pdf` download |
| `GET /api/v1/export/loan-clients/csv` | `text/csv` download |

PDF includes a branded header with total record count and generated timestamp.

---

## File Uploads — `/api/v1/files`

Auth required.

### `POST /api/v1/files/upload`
Upload a file attachment.

**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Description |
|-------|------|-------------|
| `file` | binary | **Required.** Max 10 MB |
| `entityType` | string | `buyer`, `seller`, `renter`, or `loan_client` |
| `entityId` | string (UUID) | ID of the parent record |

Allowed MIME types: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), plain text, JPEG, PNG.

**Response `201`** — FileUpload object

---

### `GET /api/v1/files/entity/:entityType/:entityId`
List all files attached to a record.

**Response** — array of FileUpload objects

---

### `GET /api/v1/files/:fileId/download`
Stream file content. Accepts token via `?token=<jwt>` query param for direct browser download links.

**Response** — file binary with `Content-Disposition: attachment`

---

### `DELETE /api/v1/files/:fileId`
Delete file from storage and database. Writes audit log.

---

## Users — `/api/v1/users`

Admin+ required for all endpoints.

### `GET /api/v1/users`
**Query params:** `page`, `limit`, `role`

---

### `POST /api/v1/users`
Create a new user account.

**Body**
```json
{
  "email": "agent@nesh.com",
  "password": "initial-password",
  "fullName": "New Agent",
  "role": "AGENT"
}
```

---

### `PUT /api/v1/users/:id`
Update user profile or role.

---

### `DELETE /api/v1/users/:id`
Deactivate (soft delete) a user. Super Admin only.

---

## TypeScript Types

Defined in `frontend/src/types/index.ts` and `backend/src/types/index.ts` (identical).

```typescript
enum UserRole    { SUPER_ADMIN, ADMIN, AGENT }
enum UserStatus  { ACTIVE, INACTIVE, SUSPENDED }
enum BuyerStatus { NEW, ACTIVE, CONVERTED, LOST, INACTIVE }
enum SellerStatus{ NEW, ACTIVE, SOLD, LOST, INACTIVE }
enum RenterStatus{ ACTIVE, INACTIVE, EVICTED, MOVED_OUT }
enum LoanStatus  { NEW, PROCESSING, APPROVED, REJECTED, CLOSED }

interface Buyer {
  id: string; agentId: string; name: string; phoneNumber: string;
  email?: string; location?: string; propertyOfInterest?: string;
  leadSource?: string; followUpDate?: string; status: BuyerStatus;
  notes?: string; createdAt: string; updatedAt: string;
}
// Seller, Renter, LoanClient follow the same pattern
```
