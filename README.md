# Fixl Warehouse Management System

A full-stack warehouse operations and inventory management application built with React, Vite, Node.js, Express, and MongoDB. It is organized as a single repository containing separate frontend and backend applications.

> **Project status:** This README documents the codebase provided in the project archive. Before deploying it for real warehouse use, run the setup and verification steps below, review security settings, and confirm the business rules with the project owner.

## Features

The application includes code for the following areas:

- **Authentication and access control:** login, logout, current-user lookup, password change, role-aware API routes, and cookie-based authentication.
- **Products:** product catalogue, product details, product updates, and admin-controlled deactivation.
- **Inventory:** inventory overview, stock movements, and inventory-related operations.
- **Warehouse operations:** configurable operational resources including shipments, transport providers, vehicles, drivers, suppliers, and related records.
- **Workforce:** worker records, staffing agencies, attendance, task assignments, and bonus records.
- **Worker portal:** employee self-service routes for attendance and task status.
- **Reports:** dashboard, inventory valuation, product profitability, stock movements, workforce costs, bonuses, and expenses.
- **Audit visibility:** audit-log routes and record details.
- **Assistant:** a backend assistant endpoint and frontend chat interface.

The exact actions available to a user depend on their role and the backend authorization rules. Hiding a navigation item in the frontend is not a security boundary; the API must enforce permissions too.

## Repository layout

```text
Warehouse_management/
├── README.md
├── .gitignore
├── frontend/
│   ├── README.md
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── src/
└── backend/
    ├── README.md
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    └── src/
```

## Prerequisites

- Node.js **20 or later** (the backend declares `node >=20`; Node 22 LTS is a suitable choice).
- npm.
- A MongoDB database, local or hosted (for example, MongoDB Atlas).
- Git and a GitHub account.

## Local setup

Open **two terminals** from the repository root.

### 1. Configure the backend

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` and fill in the values. On Windows PowerShell, run:

```powershell
Copy-Item .env.example .env
```

Required values include:

- `MONGODB_URI`: connection string for the database you intend to use.
- `JWT_SECRET`: a newly generated random secret of at least 32 characters.
- `CLIENT_ORIGIN`: the frontend origin, normally `http://localhost:5173` for local development.

Set the remaining cookie, password-hashing, and attendance-window variables to suitable values. Keep the real `.env` file private; commit only `.env.example` with placeholders.

Start the backend:

```bash
npm run dev
```

The API defaults to port `5000`. The server connects to MongoDB before it starts listening.

### 2. Configure the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env`:

```powershell
Copy-Item .env.example .env
```

Set `VITE_API_BASE_URL` to the backend API base URL, for example:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

`VITE_DEMO_LOGIN_PASSWORD` is only for a frontend demo-login shortcut if that feature is enabled in the current UI. Do not use a real employee password here. **Vite exposes `VITE_` variables to client-side code**, so never put secrets or privileged credentials in them.

Run the frontend:

```bash
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

### 3. Verify the application

- Open the frontend URL and confirm the login page loads.
- Confirm the backend is reachable at `http://localhost:5000/api/v1/health` (the exact response is defined by the health route).
- Sign in with an account that has been created in your own development database.
- Test access with accounts for different roles; verify both frontend navigation and API authorization.
- Test product CRUD, stock movements, warehouse operations, workforce/attendance, reports, audit logs, and assistant functionality.
- Verify that invalid inputs and unauthorized requests fail safely.

## Backend scripts

Run these from `backend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API without nodemon |
| `npm run check` | Run the project's syntax-check script |
| `npm run seed:admin` | Run the admin seed script; configure the required seed environment values first |
| `npm run seed:demo` | Run the demo seed script only against an explicitly permitted non-production database |

**Seeding caution:** inspect the seed scripts and their environment guards before running them. Use a disposable development database. Never run demo seeding against production or a database containing real warehouse data.

## API overview

The backend mounts versioned routes under `/api/v1`, including:

- `/health`
- `/auth`
- `/worker-portal`
- `/users`
- `/audit-logs`
- `/products`
- `/inventory`
- `/reports`
- operational resources mounted under `/api/v1`
- `/assistant`

Consult the route files under `backend/src/modules/` for exact methods, payload schemas, role requirements, and response shapes. Do not assume that every route supports every HTTP method.

## Security and configuration notes

- Do not commit `.env` files, database credentials, JWT secrets, real employee data, or production exports.
- Cookie authentication uses credentialed cross-origin requests. Configure `CLIENT_ORIGIN` to the exact frontend origin; do not use a wildcard origin with credentials.
- Production deployments need HTTPS and appropriate secure-cookie settings. Review `COOKIE_SECURE` and `COOKIE_SAME_SITE` against the actual deployment topology.
- Keep demo credentials and seed data out of production.
- Review dependency audit output and update dependencies deliberately rather than blindly upgrading everything.
- Do not treat client-side role-based navigation as authorization. Verify access controls on every protected API route.
- The assistant integration's expected configuration and any external service dependencies should be checked in its service implementation before deployment.

## Deployment

Deploy the frontend and backend as separate services or deploy them behind a shared origin. Configure:

- Backend environment variables, including a production MongoDB URI and a strong unique `JWT_SECRET`.
- `CLIENT_ORIGIN` to the deployed frontend's exact origin.
- Frontend `VITE_API_BASE_URL` to the deployed backend's `/api/v1` base URL.
- HTTPS, secure cookies, CORS, and any platform-specific health checks.
- A production database backup and restore process.

Build the frontend before deploying:

```bash
cd frontend
npm ci
npm run build
```

The generated `frontend/dist/` directory is build output and normally should not be committed.

## GitHub publishing checklist

1. Remove local `.env` files from the repository working tree; keep `.env.example`.
2. Ensure `node_modules/`, build output, logs, coverage, and OS/editor files are ignored.
3. Review `git status` and inspect every file staged for commit.
4. Search for credentials, tokens, connection strings, personal data, and private exports.
5. Commit the source, lockfiles, documentation, and safe configuration examples.
6. Push to a repository you control.

If a secret has ever been committed or pushed, deleting the file in a later commit is not sufficient. Rotate the exposed credential, then clean the Git history if necessary.

## Troubleshooting

- **Backend exits during startup:** check `backend/.env`, especially `MONGODB_URI` and `JWT_SECRET`, and confirm the database network/IP access settings.
- **Frontend cannot reach the API:** check `VITE_API_BASE_URL`, the backend port, and `CLIENT_ORIGIN`.
- **Login works but later requests fail:** inspect cookie settings, browser cookie policies, CORS credentials, and whether the frontend and backend use the expected origins.
- **A feature is missing for a role:** inspect frontend navigation configuration and the corresponding backend route authorization. Both should agree.
- **Demo seed refuses to run:** read the seed script's guard conditions and verify that the database name and opt-in environment variables satisfy them.

## License

No license is specified in the supplied project files. Add a license only after confirming that you have permission to publish and distribute this code.
