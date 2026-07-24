# ISSA — Integrated Student School Application

ISSA is a longitudinal student record system that connects teacher record-keeping with parent visibility into each student's ongoing development. Teachers maintain attendance, academic results, feedback, schedules, and activities through a dedicated workspace, while parents receive a focused view of the same student journey.

ISSA v1.0.0 is a portfolio-ready demo of the core Teacher-to-Parent data flow. It is not presented as a production-grade SaaS platform.

## Live demo

| Surface | Link |
| --- | --- |
| Parent App | [issa-parent.vercel.app](https://issa-parent.vercel.app) |
| Teacher CMS | [issa-teacher.vercel.app](https://issa-teacher.vercel.app) |
| API Health | [issa-api.onrender.com/health](https://issa-api.onrender.com/health) |

## Demo credentials

| Role | Identifier | Password |
| --- | --- | --- |
| Teacher | NIP `2026001001` | `GuruDemo2026` |
| Parent | NIM `2026071001` | `OrangTua2026` |

These public credentials are intended only for the curated demo environment.

## Core capabilities

- Daily attendance records with dated history and explicit attendance statuses.
- Academic scores evaluated against each lesson's KKM threshold.
- Longitudinal teacher feedback history with observation timestamps.
- Weekly class schedules.
- Student activity visibility.
- Role-based authentication for teachers and parents.
- Teacher-to-Parent data flow through one shared student record.

```text
Teacher CMS
    │
    │ records attendance, scores, and feedback
    ▼
Node.js API ── PostgreSQL longitudinal record
    │
    │ exposes the authorized student view
    ▼
Parent App
```

## Architecture

| Layer | Technology |
| --- | --- |
| Parent Client | React + Vite |
| Teacher CMS | React + Vite |
| Server | Node.js + Express |
| Database | PostgreSQL + Sequelize |
| Deployment | Vercel, Render, Neon |

The Server is organized as a pragmatic modular monolith with explicit routes, controllers, services, repositories where useful, and globally shared Sequelize models and migrations.

## Monorepo structure

```text
issa/
├── client/                 # Parent-facing React application
├── cms-side/               # Teacher CMS React application
├── server/                 # Express API, Sequelize models, migrations, and demo data
├── scripts/                # Repository-level Codebook tooling
├── CODEBOOK.json           # Executable responsibility reference
├── CODEBOOK_INDEX.md       # Generated Codebook index
└── DEPLOYMENT_READINESS.md # Provider-neutral deployment notes
```

## Run locally

### Prerequisites

- A current Node.js LTS release and npm.
- PostgreSQL with the `psql` command available.
- Three terminal sessions for the Server, Parent App, and Teacher CMS.

### 1. Install dependencies

From the repository root:

```bash
npm ci --prefix server
npm ci --prefix client
npm ci --prefix cms-side
```

### 2. Configure local environment

Create local environment files from the provided examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp cms-side/.env.example cms-side/.env
```

For local development, configure `server/.env` with values equivalent to:

```dotenv
NODE_ENV=development
PORT=3000
JWT_SECRET=replace-with-a-local-development-secret

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=issa_project_dev
DB_USER=issa_dev
DB_PASSWORD=replace-with-your-local-password
```

Configure both frontend environment files:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Do not commit real credentials or local `.env` files.

### 3. Prepare the curated demo database

From `server/`:

```bash
npm run db:reset-demo
npm run db:verify-demo
```

`db:reset-demo` is intentionally restricted to a recognized local development database. It drops and recreates only that guarded local target, runs migrations, loads the curated JSON dataset, and verifies the resulting records.

### 4. Start the applications

Run each command in a separate terminal:

```bash
cd server
npm start
```

```bash
cd client
npm run dev -- --port 3001
```

```bash
cd cms-side
npm run dev -- --port 3100
```

The local Parent App and Teacher CMS ports match the Server's development CORS allowlist.

## Environment variables

### Server

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Selects development, test, or production configuration |
| `PORT` | HTTP server port |
| `JWT_SECRET` | JWT signing and verification secret |
| `DATABASE_URL` | PostgreSQL URL used in production |
| `DATABASE_SSL` | Enables or disables production database SSL |
| `FRONTEND_ORIGINS` | Comma-separated exact Parent App and Teacher CMS origins |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Local development database connection |
| `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_NAME`, `TEST_DB_USER`, `TEST_DB_PASSWORD` | Optional isolated test database |
| `ALLOW_REMOTE_DEMO_BOOTSTRAP` | Explicit one-time confirmation for guarded remote demo bootstrap |

### Parent App and Teacher CMS

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public base URL of the ISSA API |

Example values are available in each package's `.env.example` file. No real secrets are stored in the repository.

## Curated demo dataset

The deterministic demo dataset lives in `server/data-seeding/` as JSON and is the single source of truth for demo records. It includes:

- 5 teachers and 3 classes;
- 18 students with linked parent accounts;
- weekly schedules and student activities;
- more than 300 dated attendance records;
- academic records covering below, equal to, and above KKM outcomes;
- teacher feedback history and latest-feedback snapshots.

The dataset is designed to make the longitudinal record visible immediately after login without relying on ad hoc fixtures or manual account creation.

## Current scope and limitations

- ISSA v1.0.0 focuses on the core teacher recording and parent visibility journey.
- The included accounts and dataset are public demo data, not real school records.
- Some legacy modules remain outside the active application routes and are not part of the v1.0.0 demo.
- Student photos use approved external HTTPS references and depend on the availability of that external host.
- Operational concerns such as organization tenancy, regulatory compliance, production observability, rate limiting, disaster recovery, and full administrative workflows are outside the current portfolio scope.
- The project demonstrates a deployable product slice; it should not be interpreted as a production-grade SaaS offering.

## Release

[ISSA v1.0.0](https://github.com/macnesa/issa/releases/tag/v1.0.0) is the current portfolio release.
