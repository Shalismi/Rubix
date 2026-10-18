# Rubix

Rubix is a full-stack task management application built with React,
TypeScript, Express, PostgreSQL, and Prisma.

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

## Database

The server requires PostgreSQL and a local `server/.env` file based on
`server/.env.example`. Apply committed schema changes with:

```powershell
cd C:\Mushroom\Rubix\server
npm.cmd run db:migrate
```

## Automated Tests

Run the server integration suite from `C:\Mushroom\Rubix\server`:

```powershell
npm.cmd test
```

The test command type-checks the server and tests, creates a separate
`rubix_test` PostgreSQL database, verifies authentication and user-owned task
behavior, and deletes the test database afterward. It does not modify the
development `rubix` database.
