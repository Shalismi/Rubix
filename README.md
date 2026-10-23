# Rubix

[![CI](https://github.com/Shalismi/Rubix/actions/workflows/ci.yml/badge.svg)](https://github.com/Shalismi/Rubix/actions/workflows/ci.yml)

Rubix is a full-stack task management application built with React,
TypeScript, Express, PostgreSQL, and Prisma.

Live app: [https://rubix-feqe.onrender.com](https://rubix-feqe.onrender.com)

## Run Locally

Start the API from the repository root:

```powershell
cd server
npm.cmd run dev
```

In another terminal, start the React client:

```powershell
cd client
npm.cmd run dev
```

The client runs at `http://localhost:5173` and the API runs at
`http://localhost:5000`.

The client can read its API address from `VITE_API_URL`. Local development uses
`http://localhost:5000` by default. In the combined production deployment, the
client uses the same origin as the API, so this variable is optional. Values
whose names begin with `VITE_` are visible in browser code and must not contain
passwords or other secrets.

## Run With Docker

Docker runs the compiled Rubix application and an isolated PostgreSQL 18
database. From the repository root, start the stack with:

```powershell
docker compose up --build
```

Open `http://localhost:8080`. The `migrations` service applies every committed
Prisma migration before the app starts, and the named `postgres_data` volume
keeps local Docker data between restarts.

Stop the stack with:

```powershell
docker compose down
```

To also delete the Docker database and start empty, use:

```powershell
docker compose down --volumes
```

The Docker database is separate from the PostgreSQL installation on the host
and from the production Supabase database.

- `Dockerfile` builds the frontend and server into the production app image.
- `compose.yaml` starts the app, database, and database migrations together.
- `.dockerignore` keeps secrets, dependencies, and build output out of the
  image build context.

For production hosting, configure the server with `DATABASE_URL` and
`NODE_ENV=production`. Render provides the HTTPS origin and `PORT`
automatically. Other hosting platforms also need the exact HTTPS
`CLIENT_ORIGIN`.
Apply committed database migrations in production with:

```powershell
npm.cmd run db:migrate:deploy
```

## Email Verification

Email delivery is intentionally disabled while Rubix is a free portfolio
project. Local development provides a direct verification link in Settings,
and CI uses the same test-only flow to verify secure, expiring, single-use
tokens without sending email.

The deployed application accepts an optional, validly formatted email for
sign-in but does not claim ownership verification or offer email-based
password recovery. Those features require an email delivery provider and a
verified sending domain.

## Account Recovery

Rubix provides password recovery without email through one-time recovery
codes. New accounts receive a code once during registration. Signed-in users
can replace their code from Settings after confirming their current password.
A successful password reset replaces the used code and revokes every existing
session for the account.

Only a SHA-256 fingerprint of each recovery code is stored in PostgreSQL. The
readable code cannot be retrieved later, so users who lose it must create a new
one while they can still sign in.

## Database

The server requires PostgreSQL and a local `server/.env` file based on
`server/.env.example`. Apply committed schema changes with:

```powershell
cd server
npm.cmd run db:generate
npm.cmd run db:migrate
```

## Automated Tests

Run the server integration suite from the `server` directory:

```powershell
npm.cmd test
```

The test command type-checks the server and tests, creates a separate
`rubix_test` PostgreSQL database, verifies authentication plus user-owned task,
tag ordering, recovery-code resets, and recycle-bin behavior, and deletes the
test database afterward. It does not modify the development `rubix` database.

## Continuous Integration

GitHub Actions runs the client lint/build checks and the server test/build
checks whenever code is pushed to `main` or included in a pull request to
`main`. The server job uses a temporary PostgreSQL database hosted inside the
GitHub Actions runner. A separate Docker job validates `compose.yaml` and
builds the production image without publishing it.

CI verifies the project automatically, but it does not publish the application
to the internet. Hosting the client, API, and production database is a separate
deployment step.

## Secrets And Configuration

Local database credentials belong in `server/.env`, which Git ignores. The
tracked `server/.env.example` contains only placeholders. Production secrets,
such as `DATABASE_URL`, belong in the Render Environment page and must never be
added to source files or variables whose names start with `VITE_`.

The password in `compose.yaml` is only for the isolated local Docker database.
That database does not publish its port and is not used by Render or Supabase.

## Render Deployment

Rubix deploys as one Render web service. Express serves the built React client
and the `/api` routes from the same public origin.

- Build command: `npm run render-build`
- Start command: `npm start`
- Health check path: `/api/health`
- Root directory: leave blank

The Render service needs `DATABASE_URL` and `NODE_ENV=production`. Render
provides its public URL and listening port automatically.
