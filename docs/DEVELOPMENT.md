# Development and deployment

Setup, configuration, testing, and hosting details for Rubix.

[Back to the project overview](../README.md)

## Run With Docker

Docker is the quickest way to run the complete application with an isolated
database. Docker Desktop must be running.

```powershell
docker compose up --build
```

Open `http://localhost:8080`.

The Compose stack contains three services:

- `database` runs PostgreSQL and stores its data in a named Docker volume.
- `migrations` applies committed Prisma migrations, then exits successfully.
- `app` runs the compiled React client and Express API.

Stop the stack while preserving its database:

```powershell
docker compose down
```

Delete the Docker database and start fresh:

```powershell
docker compose down --volumes
```

The Docker database is separate from PostgreSQL installed on the computer and
from the production Supabase database.

## Run For Development

### Prerequisites

- Node.js 24
- PostgreSQL
- npm

Create an empty PostgreSQL database named `rubix`, then install dependencies
from the repository root:

```powershell
npm.cmd ci --prefix client
npm.cmd ci --prefix server
```

Create the local server configuration and replace the password placeholder in
`server/.env` with the local PostgreSQL password:

```powershell
Copy-Item server/.env.example server/.env
```

Generate the Prisma client and apply the committed migrations:

```powershell
npm.cmd run db:generate --prefix server
npm.cmd run db:migrate:deploy --prefix server
```

Start the API:

```powershell
cd server
npm.cmd run dev
```

In another terminal, start the React client:

```powershell
cd client
npm.cmd run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

## Environment Variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server | PostgreSQL connection string. This is a secret. |
| `CLIENT_ORIGIN` | Server | Browser origin allowed to send authenticated requests. |
| `NODE_ENV` | Server | Enables development or production behavior. |
| `PORT` | Server | API listening port; defaults to `5000`. |
| `COOKIE_SECURE` | Server | Local Docker override; normally left unset. |
| `VITE_API_URL` | Client | API address for separate local frontend development. |

Local secrets belong in `server/.env`, which Git and Docker ignore. The tracked
`server/.env.example` contains placeholders only. Variables beginning with
`VITE_` are included in browser code and must never contain secrets.

## Tests And CI

Run the same main checks locally:

```powershell
npm.cmd run lint --prefix client
npm.cmd test --prefix client
npm.cmd run build --prefix client
npm.cmd exec --prefix client -- playwright install chromium
npm.cmd run test:e2e --prefix client
npm.cmd test --prefix server
docker compose config --quiet
docker build --target runtime --tag rubix:check .
```

The server integration suite creates a separate `rubix_test` database, tests
authentication and user-owned task flows, and removes that database afterward.
It does not change development data.

The client browser suite starts a local preview of the production build and
mocks the account and task API. It checks page URLs, Back/Forward, refresh,
sign-in redirects, registration, sign-out, and calendar navigation without
accessing real account data.

GitHub Actions runs three independent jobs for pushes and pull requests:

1. **Client checks:** installs dependencies, lints, runs unit tests, creates a
   production build, and checks browser navigation with Playwright.
2. **Server checks:** starts temporary PostgreSQL, generates Prisma, runs the
   integration suite, and builds the API.
3. **Docker checks:** validates `compose.yaml` and builds the production image.

CI verifies the project but does not deploy it or publish a Docker image.

## Production Deployment

Rubix deploys as one Render web service with these settings:

- Build command: `npm run render-build`
- Start command: `npm start`
- Health check: `/api/health`
- Root directory: blank

Render stores `DATABASE_URL` and `NODE_ENV=production` as environment
variables. Supabase provides the production PostgreSQL database. Render applies
the committed migrations during its build and automatically redeploys after a
successful push to `main`.

## Security Notes

- Passwords are hashed with Argon2 and are never stored as readable text.
- Session and verification tokens are random; only SHA-256 fingerprints are
  stored in PostgreSQL.
- Session cookies are HTTP-only, same-site, and secure over production HTTPS.
- Authentication and recovery endpoints use rate limiting.
- Server-side validation limits usernames, passwords, dates, tags, and request
  body size.
- Database access is scoped to the authenticated account.
- Local `.env` files and production credentials are excluded from Git and
  Docker builds.
