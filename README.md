# Kinfolk

## Overview

Kinfolk is a web application that helps Ugandan families preserve and reconnect with their clan-based genealogies. It enables clan leaders to build family trees, invite members, resolve relationship conflicts, and export genealogy data in the GEDCOM format. Members can explore interactive family trees, define relationships, and communicate via a private group clan chat.

## Tech Stack

### Frontend

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Redux Toolkit (global state)
- TanStack Query (server state and data fetching)
- Clerk (authentication)
- D3.js (interactive family tree visualisation)
- Stream Chat (group clan messaging)
- React Router v6 (routing)

### Backend

- Go 1.24 with Gin web framework
- PostgreSQL via Neon (serverless Postgres)
- sqlx (database access)
- Goose (database migrations)
- Clerk SDK (JWT verification)
- Resend (transactional email)
- Cloudinary (profile picture storage)
- Stream Chat (chat token generation)

## Repository Structure

```
kinfolk/
  backend/      Go Gin API
  frontend/     React TypeScript app
  README.md
```

### Backend (`backend/`)

```
cmd/server/         Application entry point: loads config, wires dependencies, starts the HTTP server
internal/config/    Reads all environment variables into a typed Config struct
internal/db/        Opens and validates the PostgreSQL connection using sqlx
internal/middleware/ Gin middleware for CORS, structured logging, and Clerk JWT verification
internal/models/    Plain Go structs that map to database tables
internal/handlers/  HTTP handler layer: binds requests, calls services, writes responses
internal/services/  Business logic layer: relationship inference, member matching, GEDCOM export, email, audit
internal/repository/ Database access layer: all SQL queries, one file per table
internal/router/    Registers all route groups and wires handlers to paths
migrations/         Goose SQL migration files numbered 001 through 008
```

### Frontend (`frontend/src/`)

```
api/            Axios-based typed wrappers for every backend endpoint, one file per domain
components/     Shared, reusable UI components (layout, ui primitives, tree, chat)
features/       Page-level components grouped by role: auth, dashboard, clan, clanLeader, admin, landing
hooks/          TanStack Query hooks that call api/ functions and manage server state
store/          Redux Toolkit store with slices for auth, clan, and UI state
types/          TypeScript interfaces mirroring every backend model
utils/          Pure helper functions (relationship label mapping, etc.)
```

## Roles

**Admin** — There is one admin account, seeded automatically at server startup using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. The admin does not use Clerk sign-up; the account is inserted directly into the database on first boot. From the admin dashboard the admin can view and manage all users, create clan leader accounts (which triggers a welcome email with temporary credentials), review and approve or reject interest forms submitted from the landing page, and browse the append-only audit log.

**Clan Leader** — Clan leader accounts are provisioned by the admin. On first login the clan leader must reset their temporary password. Once authenticated, the clan leader creates their clan, adds historical member records (people who may not yet have a Kinfolk account), views and resolves relationship conflicts flagged by the inference engine, approves or rejects fuzzy name-match suggestions for newly registered members, and monitors the family tree.

**General User** — General users sign up through the Kinfolk landing page or signup form using Clerk. During signup they specify their clan name; the backend runs a member-matching heuristic to check whether a member slot already exists for them in that clan. Once signed in, users complete their profile, browse their clan's member list, define their personal relationships to other members, explore the interactive D3.js family tree, export the clan genealogy as a GEDCOM file, and communicate with other clan members via the private Stream Chat channel.

## Prerequisites

The following must be installed and configured before running the project:

- **Go 1.24 or later** — required to build and run the backend
- **Node.js 20 or later** — required to build and run the frontend
- **Docker and Docker Compose** — used by `make dev` to run the backend with hot reload
- **Clerk account** (https://clerk.com) — create an application; collect the publishable key (for the frontend) and the secret key (for the backend)
- **Resend account** (https://resend.com) — collect the API key; verify the domain `kinfolkapp.me` so outbound emails are delivered
- **Stream Chat account** (https://getstream.io) — create an app; collect the API key and API secret
- **Cloudinary account** (https://cloudinary.com) — use your Cloudinary product environment credentials; the current cloud name is `dcqr1595e`
- **Neon Postgres database** (https://neon.tech) — create a project; collect the pooler connection string (for the app) and the direct connection string without pooling (for migrations)

## Environment Setup

### Backend

The backend reads all configuration from `kinfolk/backend/.env`. Copy `.env.example` to `.env` and fill in every value.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooler connection string, used by the application at runtime |
| `DATABASE_DIRECT_URL` | Neon direct connection string without the pooler, used by Goose for migrations to avoid PgBouncer prepared-statement incompatibility |
| `PORT` | Port the HTTP server binds to; default `8081` |
| `CLERK_SECRET_KEY` | Found in the Clerk dashboard under Backend API keys |
| `RESEND_API_KEY` | Found in the Resend dashboard |
| `CLOUDINARY_CLOUD_NAME` | `dcqr1595e` |
| `CLOUDINARY_API_KEY` | Found in the Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Found in the Cloudinary dashboard |
| `STREAM_API_KEY` | Found in the Stream dashboard for your app |
| `STREAM_API_SECRET` | Found in the Stream dashboard for your app |
| `ADMIN_EMAIL` | `info@kinfolkapp.me` — the admin account that is seeded on first boot |
| `ADMIN_PASSWORD` | `Agumya@2026!` — stored for reference only; used during manual Clerk account creation |
| `TEMP_CLAN_LEADER_PASSWORD` | `TempPass@2026!` — sent to new clan leaders via welcome email |
| `FRONTEND_URL` | `http://localhost:5173` in development; your production domain in production |
| `APP_ENV` | `development` or `production` |

### Frontend

The frontend reads all configuration from `kinfolk/frontend/.env`. Copy `.env.example` to `.env` and fill in every value.

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Found in the Clerk dashboard under Frontend API keys |
| `VITE_STREAM_API_KEY` | Found in the Stream dashboard for your app |
| `VITE_API_BASE_URL` | `http://localhost:8081` in development; your production API URL in production |

## Running Locally

### Backend

```bash
# Step 1: enter the backend directory
cd kinfolk/backend

# Step 2: copy the example env file and fill in all values
cp .env.example .env

# Step 3: apply all database migrations
make migrate-up

# Step 4: start the development server with hot reload via Docker Compose
make dev
```

The API will be available at `http://localhost:8081`.

Health check: `GET http://localhost:8081/health`

### Frontend

```bash
# Step 1: enter the frontend directory
cd kinfolk/frontend

# Step 2: copy the example env file and fill in all values
cp .env.example .env

# Step 3: install dependencies
npm install

# Step 4: start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Database Migrations

Migrations are written in SQL and managed with [Goose](https://github.com/pressly/goose). All migration files live in `kinfolk/backend/migrations/`.

```bash
make migrate-up      # Apply all pending migrations
make migrate-down    # Roll back the last applied migration
make migrate-status  # Show the current migration state
```

Migrations run against `DATABASE_DIRECT_URL` (not the pooler connection string). This is required because PgBouncer in transaction-pooling mode is incompatible with Goose's use of prepared statements and advisory locks.

## Building for Production

```bash
# Build the backend Docker image
cd kinfolk/backend
make build
# Produces a Docker image tagged kinfolk-backend

# Build the frontend static assets
cd kinfolk/frontend
npm run build
# Outputs production files to kinfolk/frontend/dist/
```

## Postman Collection

`kinfolk/backend/kinfolk.json` is a Postman Collection v2.1 file containing every API endpoint organised into folders.

To import: open Postman, click **Import**, and select `kinfolk.json`.

Set two collection variables before making requests:
- `base_url` — the base URL of the API (e.g. `http://localhost:8081`)
- `clerk_token` — a valid Clerk JWT; obtain this from your browser's developer tools after signing in to the frontend (look for the `Authorization: Bearer ...` header on any authenticated request)

The collection contains 12 folders:

| Folder | Contents |
|---|---|
| **Health** | Single `GET /health` endpoint for uptime checks |
| **Auth** | `POST /auth/sync` to upsert the Clerk user into the local database on first login |
| **Users** | Get, update, and delete the authenticated user's own record; complete profile |
| **Clans** | Validate a clan name, fetch a clan by ID, fetch clan members |
| **Members** | Add a member to a clan (clan leader only) |
| **Relationships** | Submit a relationship between a user and a member; list all relationships for a clan; get tree data |
| **Conflicts** | List open conflicts for a clan; resolve a conflict with a chosen resolution |
| **Match Suggestions** | List pending member-match suggestions; approve or reject a suggestion |
| **Clan Leader** | Create a new clan (clan leader only) |
| **Chat** | Get a Stream Chat user token for the authenticated user |
| **Interest Forms** | Submit a public interest form from the landing page |
| **Admin** | List users; create a clan leader; suspend or delete a user; list audit logs; list and update interest forms |

## Database Schema

**users** — Stores every platform user, including their Clerk user ID (used to verify JWTs), their role (`general_user`, `clan_leader`, or `admin`), optional clan association, profile details (birth year, gender, phone, profile picture URL), and flags for suspension and required password reset.

**clans** — Stores clan records with a unique name and a reference to the clan leader's user ID. A clan must be created by a clan leader before any members can be added to it.

**members** — Stores historical family members added by clan leaders, which may represent people who have not yet registered on the platform. Each member record can be linked to a user account once a matching user signs up, either automatically (exact email or high-confidence name match) or after clan leader approval.

**relationships** — Stores every relationship between a user and a member within a clan. Each row records who submitted it, the relationship type (from a fixed vocabulary of 16 types), whether it was directly submitted or inferred by the engine, and a status of `active`, `pending`, or `conflicted`. Conflicted relationships are flagged when two users submit contradictory relationships for the same pair.

**conflicts** — Created when the relationship submission service detects a contradiction between a new submission and an existing active relationship. Each conflict references both relationship IDs and is resolved by the clan leader choosing to approve one, approve the other, or reject both.

**interest_forms** — Stores submissions from the public interest form on the landing page. Each form captures the submitter's name, clan name, contact details, expected member count, region, and an optional message. The admin reviews each form and marks it approved or rejected.

**audit_logs** — An append-only table that records significant actions taken on the platform, including who performed the action, what type of entity was affected, the entity's ID, and a JSON metadata field for additional context. Used by admins to review platform activity.

**member_match_suggestions** — Created when a newly registered user's name is a fuzzy match (score 70-84) to an existing unlinked member record in their clan. The clan leader reviews each suggestion and either approves it (linking the user to the member) or rejects it. Scores of 85 or above result in automatic linking without a suggestion being created.

## Key Architectural Decisions

### Authentication

Clerk handles all authentication. The frontend uses `ClerkProvider` and the `useSignIn`/`useSignUp` hooks for the login and signup flows. Every protected API request carries a Clerk JWT in the `Authorization: Bearer` header; the backend verifies this token on every request using the Clerk Go SDK middleware. Because Clerk does not store application-specific data such as role or clan association, a local user record is maintained in Postgres. This record is created or updated on first login via `POST /api/v1/auth/sync`, which the frontend calls immediately after Clerk sign-in completes.

### Relationship Inference Engine

When a newly submitted relationship is accepted and becomes active, the backend runs a graph traversal inference pass over all active relationships in that clan. A fixed rule table maps known relationship pairs to their implied third relationship (for example, parent-of-parent implies grandparent-of-grandchild; sibling-of-parent implies uncle or aunt; spouse-of-parent implies step-parent). Inferred relationships are written to the `relationships` table with `is_inferred = true`. The family tree displays them as dashed lines to distinguish them from directly submitted relationships. The inference pass runs synchronously at submission time and does not recurse; a single pass covers one degree of implication.

### Member Matching

When a user signs up and specifies their clan name, the backend runs a matching pass against all unlinked member records in that clan. An exact email match results in automatic, immediate linking. If no email match is found, all member names in the clan are compared against the user's full name using token-sorted, normalised fuzzy scoring via the `fuzzysearch` library. A score of 85 or above triggers automatic linking. A score between 70 and 84 creates a pending `member_match_suggestions` record for the clan leader to review. Scores below 70 are ignored.

### Profile Picture Upload

Profile pictures are uploaded directly from the browser to Cloudinary using an unsigned upload preset (`kinfolk_unsigned`). The browser receives a `secure_url` from Cloudinary in response and sends only that URL to the backend, which stores it in the `users` table. No image data passes through the backend server, keeping the API lightweight and avoiding storage concerns on the server side.

### Family Tree Visualisation

The family tree uses a D3.js force simulation to position clan members as circular nodes. The simulation runs for 300 ticks and is stopped before the SVG is rendered, producing a static layout that does not animate on load. Relationships are drawn as SVG lines: solid gold lines for directly submitted relationships and dashed brown lines for inferred ones. The tree supports mouse-wheel zoom and drag panning. Hovering over a node shows a tooltip with the member's name, birth year, and gender. A legend in the bottom-left corner explains the line styles.

### Group Chat

Each clan is assigned a private Stream Chat messaging channel identified by the clan's UUID. When the frontend loads the chat view, it requests a user token from `GET /api/v1/chat/token`. The backend generates this token by signing a payload with the Stream API secret using HMAC-SHA256 and returns it alongside the user ID and API key. The frontend initialises the Stream Chat JavaScript client, connects to the clan channel using the returned token, and renders the full chat UI via the Stream Chat React SDK.

## Contribution Guidelines

### Code Style

**Backend:** follow standard Go formatting (`gofmt`). All exported functions must have doc comments that begin with the function name. No global mutable variables — every dependency is injected through constructors. Errors must be wrapped with `fmt.Errorf` and the `%w` verb so that callers can unwrap them. Handler functions must not contain business logic; delegate to the service layer.

**Frontend:** use TypeScript strict mode. All components, props, and hook return types must be explicitly typed. Avoid `any` except where D3.js or the Stream Chat SDK force it (document the exception with a comment). Use TanStack Query for all server state; do not cache API responses in Redux. Redux stores only client-side state: the authenticated user object, clan metadata, and UI flags.

### Branch Naming

```
feature/short-description
fix/short-description
chore/short-description
```

### Pull Request Process

- All pull requests must target the `main` branch.
- The PR description must explain what changed and why, not just what files were modified.
- Both `npm run build` (frontend) and `go build ./...` (backend) must pass locally before a PR is opened.
- Never commit `.env` files or any file containing secrets or credentials.
