# Rubix Project Structure

Rubix is split into a React client and an Express/PostgreSQL server.

`package.json`
Provides the root build and start commands used by Render to deploy both apps
as one web service.

## Client

`client/src/App.tsx`
Connects the main app layout together.

`client/src/app`
App-level pieces that are not specific to one feature.

- `components`: the sidebar and top account/header area.

`client/src/config`
Shared client configuration, including the environment-based API address.

`client/src/shared`
Small cross-feature utilities, including the shared authenticated API request
helper and consistent server error handling.

`client/src/features/auth`
Account API requests, session state, registration, and sign-in UI.

`client/src/features/settings`
Logged-in account settings, including password changes.

`client/src/features/streaks`
The dashboard streak preview panel. This is currently presentation-only so the
future streak rules can be added without mixing them into task components.

`client/src/features/tags`
Reusable account-owned tags, colors, saved priority order, and filtering.

- `api`: browser requests to the tag API.
- `components`: tag pills, task picker, filter menu, and tag manager.
- `hooks`: loads tags and handles create, edit, and delete state.
- `types.ts`: tag TypeScript shapes shared with the task feature.

`client/src/features/tasks`
Everything for the task feature.

- `api`: browser requests to the task API.
- `components`: task dashboard, task cards, task form, sections, calendar panel,
  and Trash screen.
- `hooks`: active and deleted task state plus task actions.
- `utils`: date formatting and task grouping helpers.
- `types.ts`: task TypeScript shapes used by the task feature.

`client/src/styles`
CSS files split by UI area.

## Server

`server/src/index.ts`
Starts the API server.

`server/src/app.ts`
Creates the Express app, registers middleware, health check, routes, and error handling.

`server/src/config`
Validates shared server environment settings such as the client origin and port.

`server/src/db`
Database connection setup.

`server/src/features/tasks`
Everything for the task API feature.

- `taskRoutes.ts`: HTTP endpoints for active tasks and the recycle bin.
- `taskValidation.ts`: request validation and date rules.
- `taskSerializer.ts`: converts database tasks into API responses.
- `taskTypes.ts`: task API TypeScript shapes.
- `trashService.ts`: permanently removes tasks after 30 days in Trash.

`server/src/features/auth`
Registration, login, logout, sessions, password hashing, and password changes.

`server/src/features/tags`
Account-owned tag endpoints, validation, colors, saved ordering, and
duplicate-name rules.

`server/src/middleware`
Reusable Express helpers, like async error catching and the final error response.

`server/prisma`
Database schema and migration history.

- `schema.prisma`: models/tables Rubix needs.
- `migrations`: SQL history Prisma created and applied to PostgreSQL.

`server/tests`
Integration tests for authentication, session security, task and tag ownership,
task CRUD, and recycle-bin retention. The helper creates and removes a separate
`rubix_test` database.
