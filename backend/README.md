# Fixl Warehouse Management — Backend API

Express and MongoDB backend for the Fixl Warehouse Management System. It exposes versioned REST endpoints under `/api/v1` and uses Mongoose models, request validation, authentication middleware, and role-based route protection.

## Requirements

- Node.js 20 or later.
- npm.
- A MongoDB database (local or hosted).

## Setup

From this directory:

```bash
npm ci
```

Create a local `.env` file:

```powershell
Copy-Item .env.example .env
```

Configure at least the required database URI and JWT secret. The server validates configuration at startup.

Example local settings (replace the placeholders with real local values):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fixl_warehouse_dev
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN=1d
COOKIE_NAME=fixl_token
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
BCRYPT_ROUNDS=12
```

The example above is for local development only. Generate a unique, unpredictable secret for each environment. Never reuse the example text as a real production secret. Configure the attendance-related variables shown in `.env.example` if those features require custom attendance windows.

Start the API:

```bash
npm run dev
```

The server connects to MongoDB before listening. By default it uses port `5000`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run with nodemon |
| `npm start` | Run with Node.js |
| `npm run check` | Run the repository's syntax-check script |
| `npm run seed:admin` | Create/seed an admin account according to the seed script |
| `npm run seed:demo` | Populate demo data if the seed script's safety checks permit it |

Read `src/scripts/seedAdmin.js` and `src/scripts/seedDemo.js` before running either seed command. Set the expected environment variables, use a disposable non-production database, and never run demo seeding against production data.

## API route groups

All paths below are mounted under `/api/v1`:

| Prefix | Purpose |
|---|---|
| `/health` | Health endpoint |
| `/auth` | Login, logout, current user, password change |
| `/worker-portal` | Worker self-service routes |
| `/users` | User management |
| `/audit-logs` | Audit history |
| `/products` | Product catalogue |
| `/inventory` | Inventory and stock movements |
| `/reports` | Dashboard and operational/financial summaries |
| `/` (operational resource routes) | Warehouse operations resources |
| `/assistant` | Assistant endpoint |

Inspect each `src/modules/*/*.routes.js` file for exact HTTP methods, request schemas, role restrictions, and response contracts. The route prefix alone does not guarantee that every operation is available to every role.

## Architecture

```text
src/
├── app.js                 Express middleware and route registration
├── server.js              Startup, database connection, graceful shutdown
├── config/
│   ├── db.js              MongoDB connection
│   └── env.js             Environment validation
├── constants/             Shared role constants
├── middleware/            Authentication, validation, error handling
├── modules/
│   ├── assistant/
│   ├── audit/
│   ├── auth/
│   ├── health/
│   ├── inventory/
│   ├── operations/
│   ├── products/
│   ├── reports/
│   ├── users/
│   └── workerPortal/
├── scripts/               Syntax check, seed and migration utilities
└── utils/                 API errors, async handlers, pagination
```

## Security notes

- Store real configuration in `.env` or your deployment platform's secret manager. Never commit `.env`.
- `JWT_SECRET` must be unpredictable and at least 32 characters, as enforced by the environment schema.
- Configure `CLIENT_ORIGIN` to the exact frontend origin. The API enables credentialed CORS, so do not use `*` as the allowed origin.
- In production, use HTTPS and review `COOKIE_SECURE` and `COOKIE_SAME_SITE` against the frontend/backend deployment arrangement.
- Login requests have a rate limiter. Review limits and monitoring before production use.
- Keep authorization checks in backend routes/controllers/services. Frontend visibility alone is not access control.
- Do not log passwords, tokens, cookies, database connection strings, or sensitive employee information.
- Review the dependency audit report and patch vulnerabilities with regression testing.

## Testing checklist

- [ ] `npm ci` completes successfully.
- [ ] `npm run check` passes.
- [ ] API starts and connects to the intended development database.
- [ ] `GET /api/v1/health` returns the expected health response.
- [ ] Login, current-user lookup, logout, and password change are tested.
- [ ] Unauthenticated and wrong-role requests are rejected.
- [ ] Product creation/update/deactivation and inventory movement flows are tested.
- [ ] Operations, attendance, tasks, workforce, reports, audit logs, and assistant routes are tested.
- [ ] Validation errors and missing resources return safe, consistent errors.
- [ ] Seed scripts are tested only against a disposable development database.

## Deployment

Set environment variables through the hosting platform. At minimum, configure production `NODE_ENV`, `PORT` if required by the platform, `MONGODB_URI`, `CLIENT_ORIGIN`, a strong unique `JWT_SECRET`, and appropriate cookie settings. Enable HTTPS, restrict database network access, and configure backups and monitoring.

The frontend's `VITE_API_BASE_URL` must point to this backend's deployed `/api/v1` base URL.

## Troubleshooting

- **Startup validation error:** compare the missing/invalid variable names with `src/config/env.js` and `.env.example`.
- **MongoDB connection failure:** verify the URI, credentials, network allowlist, and database availability.
- **Browser CORS error:** ensure `CLIENT_ORIGIN` exactly matches the frontend origin and credentials are enabled.
- **Login succeeds but protected requests fail:** verify cookie settings and that the browser sends the cookie.
- **Seed command refuses to run:** read the seed script guard conditions; do not bypass them for a production database.
