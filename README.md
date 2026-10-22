# Rubix

Rubix is a full-stack task management application built with React,
TypeScript, Express, PostgreSQL, and Prisma.

Live app: [https://rubix-feqe.onrender.com](https://rubix-feqe.onrender.com)

## Run Locally

Start the API from `C:\Mushroom\Rubix\server`:

```powershell
npm.cmd run dev
```

Start the React client from `C:\Mushroom\Rubix\client`:

```powershell
npm.cmd run dev
```

The client runs at `http://localhost:5173` and the API runs at
`http://localhost:5000`.

The client can read its API address from `VITE_API_URL`. Local development uses
`http://localhost:5000` by default. In the combined production deployment, the
client uses the same origin as the API, so this variable is optional. Values
whose names begin with `VITE_` are visible in browser code and must not contain
passwords or other secrets.

For production hosting, configure the server with `DATABASE_URL` and
`NODE_ENV=production`. Render provides the HTTPS origin and `PORT`
automatically. Other hosting platforms also need the exact HTTPS
`CLIENT_ORIGIN`.
Apply committed database migrations in production with:

```powershell
npm.cmd run db:migrate:deploy
```

## Database

The server requires PostgreSQL and a local `server/.env` file based on
`server/.env.example`. Apply committed schema changes with:

```powershell
cd C:\Mushroom\Rubix\server
npm.cmd run db:generate
npm.cmd run db:migrate
```

## Automated Tests

Run the server integration suite from `C:\Mushroom\Rubix\server`:

```powershell
npm.cmd test
```

The test command type-checks the server and tests, creates a separate
`rubix_test` PostgreSQL database, verifies authentication plus user-owned task,
tag ordering, and recycle-bin behavior, and deletes the test database afterward.
It does not modify the development `rubix` database.

## Continuous Integration

GitHub Actions runs the client lint/build checks and the server test/build
checks whenever code is pushed to `main` or included in a pull request to
`main`. The server job uses a temporary PostgreSQL database hosted inside the
GitHub Actions runner.

CI verifies the project automatically, but it does not publish the application
to the internet. Hosting the client, API, and production database is a separate
deployment step.

## Render Deployment

Rubix deploys as one Render web service. Express serves the built React client
and the `/api` routes from the same public origin.

- Build command: `npm run render-build`
- Start command: `npm start`
- Health check path: `/api/health`
- Root directory: leave blank

The Render service needs `DATABASE_URL` and `NODE_ENV=production`. Render
provides its public URL and listening port automatically.
