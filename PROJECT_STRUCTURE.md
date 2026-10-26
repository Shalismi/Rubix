# Rubix Project Structure

Rubix is split into a React client and an Express/PostgreSQL server.

`package.json`
Provides the root build and start commands used by Render to deploy both apps
as one web service.

`Dockerfile`
Builds the React client and Express server, then copies only their production
output and server runtime dependencies into the final image.

`compose.yaml`
Runs the production image with an isolated local PostgreSQL database and a
one-time migration service.

`.dockerignore`
Keeps local secrets, installed dependencies, generated output, and repository
metadata out of the Docker build context.

`.github/workflows/ci.yml`
Runs the client, server, and Docker checks for pushes and pull requests.

`docs/screenshots`
Stores the product screenshots displayed in the GitHub README.

## Client

`client/src/App.tsx`
Connects the main app layout together.

`client/src/app`
App-level pieces that are not specific to one feature.

- `components`: the sidebar and top account/header area.
- `config`: font choices and rotating welcome messages.
- `hooks`: saved font preferences for each account.

`client/src/config`
Shared client configuration, including the environment-based API address.

`client/src/shared`
Small cross-feature utilities, including the shared authenticated API request
helper and consistent server error handling.

`client/src/features/auth`
Account API requests, session state, registration, and sign-in UI.

`client/src/features/settings`
Logged-in font and account settings, including password changes.

`client/src/features/streaks`
Loads account streak data and displays the current count plus weekly activity.

`client/src/features/tags`
Reusable account-owned tags, colors, saved priority order, and filtering.

- `api`: browser requests to the tag API.
- `components`: tag pills, task picker, filter menu, and tag manager.
- `hooks`: loads tags and handles create, edit, and delete state.
- `types.ts`: tag TypeScript shapes shared with the task feature.

`client/src/features/tasks`
Everything for the task feature.

- `api`: browser requests to the task API.
- `components`: task dashboard, cards with inline editing, add-task form,
  sections, calendar views, and Trash screen.
- `hooks`: active and deleted task state plus task actions.
- `utils`: date formatting, task grouping, and tag-priority sorting.
- `types.ts`: task TypeScript shapes used by the task feature.

`client/src/styles`
CSS files split by UI area, with the shared app theme in `theme.css`.

`client/public/fonts`
Locally served font files and their licenses.

`client/src/assets`
Images used by the app, including the Rubix cube logo.

`client/tests`
Task-priority regression tests run locally and by CI.

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
Registration, login, logout, sessions, password hashing, optional email
verification, password changes, and recovery codes.

`server/src/features/tags`
Account-owned tag endpoints, validation, colors, saved ordering, and
duplicate-name rules.

`server/src/features/streaks`
Records one activity day per account and calculates consecutive-day plus weekly
streak summaries in the browser's timezone.

`server/src/middleware`
Reusable Express helpers, like async error catching and the final error response.

`server/prisma`
Database schema and migration history.

- `schema.prisma`: models/tables Rubix needs.
- `migrations`: SQL history Prisma created and applied to PostgreSQL.

`server/tests`
Integration tests for authentication, session security, task and tag ownership,
task CRUD, recovery, and recycle-bin retention. The helper creates and removes
a separate `rubix_test` database.
