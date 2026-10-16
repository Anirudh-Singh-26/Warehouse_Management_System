# Fixl Warehouse Management — Frontend

React + Vite single-page application for the Fixl Warehouse Management System. It provides the user interface for warehouse inventory, operations, workforce, reports, audit records, and the worker portal.

## Requirements

- Node.js 20 or later recommended.
- npm.
- The backend API running and accessible.

## Setup

From this directory:

```bash
npm ci
```

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Set the API base URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Then start the development server:

```bash
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend into `dist/` |
| `npm run preview` | Preview the production build locally |

Run `npm run build` before publishing or deploying. A successful build does not replace API integration and role-permission testing.

## Main source structure

```text
src/
├── app.jsx
├── main.jsx
├── api.js
├── config/
│   ├── navigation.js
│   └── resources.js
├── components/
│   ├── worker/
│   └── record-details/
├── layouts/
├── lib/
├── pages/
├── routes/
└── styles/
```

- `main.jsx`: application entry point and router setup.
- `app.jsx`: application shell and route/page composition.
- `config/navigation.js`: navigation groups, labels, icons, and role visibility.
- `config/resources.js`: resource field definitions and resource path mapping.
- `components/`: reusable UI, record detail, assistant, and worker components.
- `layouts/`: shared application layout.
- `lib/`: API helper, CSV handling, labels, formatters, and record-detail helpers.
- `pages/`: dashboard, resource views, reports, profile, user management, and worker portal.
- `routes/`: route protection.
- `styles/`: global and feature-specific styles.

## Backend integration

The shared fetch-based API helper in `src/lib/api.js` uses `VITE_API_BASE_URL` and sends requests with `credentials: "include"` for cookie-based authentication. The backend must allow the frontend's exact origin and credentialed requests.

The provided source also contains `src/api.js`, which imports Axios. Check whether this file is used before deciding whether to remove it: the provided `package.json` does not declare Axios, so an active import of that file would cause a dependency/build problem. If unused, remove the file; if used, either add Axios as an intentional dependency and update the lockfile, or migrate those imports to the existing shared API helper.

## Environment variable safety

- `VITE_API_BASE_URL` is configuration, not a secret.
- Any variable prefixed with `VITE_` may be bundled into browser-accessible code. Never store passwords, API keys, JWT secrets, or database credentials in it.
- Keep `.env` local and commit `.env.example` with safe placeholders only.
- The demo-login password variable should not contain a real employee or production credential.

## Before committing

- Remove local `.env` files from Git's staged files.
- Do not commit `node_modules/`, `dist/`, logs, coverage output, or local editor files.
- Keep `package-lock.json` so installs are reproducible.
- Run `npm ci` and `npm run build`.
- Test direct navigation and refresh on nested routes, login/logout, role-specific navigation, and API error states.
- Test with the backend running; a frontend build alone does not prove that all screens and API calls work.

## Troubleshooting

- **API requests fail:** verify the backend is running and `VITE_API_BASE_URL` ends in `/api/v1`.
- **Login cookie is not retained:** verify backend CORS credentials, exact origin, HTTPS/cookie settings, and browser cookie policy.
- **A navigation section is empty or unavailable:** inspect `src/config/navigation.js` and the user's role; also confirm the backend independently enforces authorization.
- **Build reports a missing Axios package:** check whether `src/api.js` is imported. The current package manifest does not list Axios.
