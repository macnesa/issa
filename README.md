# ISSA — Integrated Student School Application

## Project Overview

ISSA is a student learning record system that connects day-to-day Teacher observations with a focused Parent view. It keeps attendance, scores, learning journals, evidence, feedback, and school context around one student record so that progress can be discussed from traceable facts rather than isolated results.

ISSA treats data as a signal, not as a student's identity. It does not rank students, produce diagnoses, or assign risk scores. Automated summaries remain subordinate to the Teacher's professional judgment: the Teacher selects the context, reviews the wording, and decides what is saved for the Parent.

The current project is a local portfolio and interview-ready build.

## Applications

- `server/` — Express API, PostgreSQL persistence, authorization, AI grounding, and Socket.IO events.
- `cms-side/` — authenticated Teacher CMS for class records, Student Detail, search, and narrative drafting.
- `client/` — authenticated Parent App for the authorized student's learning record and recent changes.

## Core Features

- Separate Teacher and Parent authentication flows.
- Student overview and deterministic development insights.
- Attendance history and score context, including lesson KKM.
- Teacher-managed learning journal shared with the Parent view.
- Student Evidence backed by Cloudinary assets.
- Long-form Teacher feedback with history.
- Parent synchronization through authenticated Socket.IO events followed by HTTP refetch.
- Grounded Learning Narrative Copilot with source selection, citations, validation, and Teacher review.
- Authorized Teacher Universal Search across the Teacher's class.
- Deterministic, guarded local demo reset.
- Offline workspace foundation in the Teacher CMS.

The offline work is deliberately limited in scope. Cached Student Detail and a durable IndexedDB mutation-queue foundation are available, but the production Attendance and Journal forms are not yet fully connected to the offline synchronization flow.

## Grounded AI Copilot

The Grounded Learning Narrative Copilot creates a draft for one Teacher-authorized student from explicitly selected record types and a selected date range. The backend builds the source packet; the browser does not supply arbitrary evidence as trusted context.

Each generated section must reference source identifiers from that packet. The response is checked against a Zod schema and a grounding validator. The validator rejects unknown references, unsupported numbers, altered direct quotations, diagnosis language, ranking, risk scores, and student comparisons.

The result is always a draft. A Teacher can inspect citation previews, edit or remove sections, and then apply the reviewed text to the existing Feedback form. The Parent only receives Feedback after the Teacher saves it.

The provider boundary uses the existing OpenAI-compatible SDK and supports OpenAI-compatible providers. Local development can be configured to use Groq; generation requires a local provider API key that is never stored in this documentation.

TanStack Query is intentionally scoped to the AI generation workflow rather than used as a repository-wide data-layer migration.

## Universal Search

Teachers can open Universal Search from the header or with `⌘K` on macOS and `Ctrl+K` on other supported keyboards.

Search covers:

- Students
- Learning Journals
- Feedback
- Lessons
- Activities

Results are grouped and ranked by exact match, prefix match, and then contains match. The authenticated backend remains the source of truth and restricts result candidates to the Teacher's authorized class. Student, Journal, and Feedback results open Student Detail; Lesson results open the schedule view; Activity results currently return to the dashboard because there is no Activity detail page.

## Architecture

ISSA is a modular monolith:

- Express routes expose the active HTTP surface.
- Controllers translate HTTP requests and safe errors.
- Services enforce authorization and workflow rules.
- Repositories isolate feature-specific data access.
- Sequelize models and migrations manage PostgreSQL persistence.
- Socket.IO publishes small student-record invalidation events to authenticated Parent rooms.
- The Parent App refetches authorized HTTP resources after relevant realtime events.
- An AI provider boundary normalizes OpenAI-compatible generation.
- Frontend features are grouped into feature-scoped modules where the workflow warrants it.

Legacy public registration, payment, transaction, and chat routes are not mounted. Unknown and disabled legacy routes return `404`; the active Socket.IO surface contains no legacy chat handlers.

## Tech Stack

- Node.js and Express
- PostgreSQL and Sequelize
- React and Vite
- Socket.IO and `socket.io-client`
- Zod
- TanStack Query for the AI workflow
- `cmdk` for Teacher Universal Search
- IndexedDB through `idb` and a Vite PWA foundation
- Cloudinary for Student Evidence
- The official `openai` package as an OpenAI-compatible provider boundary

## Local Setup

### Prerequisites

- A current Node.js LTS release and npm.
- A local PostgreSQL server.
- Three terminal sessions for the API, Teacher CMS, and Parent App.

### 1. Clone and install the Server

```bash
git clone <repository-url>
cd issa/server
npm install
cp .env.example .env
```

Create a local development database with your preferred PostgreSQL tool. In `server/.env`, set `NODE_ENV=development`, the local `DB_*` values, a local `JWT_SECRET`, and any optional integrations needed for the demo. Do not reuse production credentials.

Apply the existing Sequelize migrations:

```bash
npx sequelize-cli db:migrate --env development
```

Load the canonical local dataset:

```bash
npm run demo:reset
```

Start the API:

```bash
npm start
```

The API listens on port `3000` unless `PORT` is changed.

### 2. Install and start the Teacher CMS

In a second terminal:

```bash
cd issa/cms-side
npm install
cp .env.example .env
npm run dev -- --port 3100
```

Set `VITE_API_BASE_URL` in `cms-side/.env` to the local API origin.

### 3. Install and start the Parent App

In a third terminal:

```bash
cd issa/client
npm install
cp .env.example .env
npm run dev -- --port 3001
```

Set `VITE_API_BASE_URL` in `client/.env` to the local API origin.

Ports `3100` and `3001` match the Server's development CORS allowlist. If those origins change, update the development configuration deliberately rather than disabling CORS.

## Environment Variables

Copy the supplied `.env.example` files and provide local values. Never commit `.env` files or real credentials.

### Database and runtime

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment; use `development` for the local demo |
| `PORT` | API port |
| `DB_HOST` | Local PostgreSQL host |
| `DB_PORT` | Local PostgreSQL port |
| `DB_NAME` | Local development database name |
| `DB_USER` | Local PostgreSQL user |
| `DB_PASSWORD` | Local PostgreSQL password |
| `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_NAME`, `TEST_DB_USER`, `TEST_DB_PASSWORD` | Optional isolated test database |
| `DATABASE_URL` | URL-based PostgreSQL configuration used outside the local development path |
| `DATABASE_SSL` | Controls SSL for URL-based database configuration |

### Authentication

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Signs and verifies Teacher and Parent access tokens |

### CORS and frontend API

| Variable | Purpose |
| --- | --- |
| `FRONTEND_ORIGINS` | Exact comma-separated frontend origins required by production configuration |
| `VITE_API_BASE_URL` | API origin used by each Vite frontend |

### Cloudinary Evidence

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API credential |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### AI Narrative

| Variable | Purpose |
| --- | --- |
| `AI_NARRATIVE_ENABLED` | Enables or disables narrative generation |
| `AI_NARRATIVE_PROVIDER` | Selects the configured provider boundary |
| `AI_NARRATIVE_API_KEY` | Local provider credential |
| `AI_NARRATIVE_BASE_URL` | OpenAI-compatible API base URL |
| `AI_NARRATIVE_MODEL` | Provider model identifier |
| `AI_NARRATIVE_TIMEOUT_MS` | Provider request timeout |

## Canonical Local Demo Data

From `server/`, run:

```bash
npm run demo:reset
```

This command is only for a local development database. Its wrapper supplies an internal confirmation token, and the script refuses production mode, non-local hosts, remote or production markers, incomplete configuration, and database names that do not look like local development targets.

The reset runs in a database transaction, cleans and recreates only the Class 1A demo scope, preserves unrelated classes and records, and produces deterministic data. It is safe to run repeatedly against the intended local target; it does not touch production.

The canonical dataset contains:

- 8 students
- 200 attendance records
- 51 scores
- 26 journal entries
- 12 feedback records
- 7 lessons
- 8 assignments
- 10 schedules
- 6 activities
- 1 validated active Evidence asset

The dataset intentionally does not claim a retracted Evidence record because only one Evidence asset has been validated for the local portfolio data.

## Demo Credentials

These accounts exist only in the canonical local demo dataset.

| Role | Identifier | Password |
| --- | --- | --- |
| Teacher | NIP `2026001001` | `GuruDemo2026` |
| Parent | NIM `2026071001` | `OrangTua2026` |

The Parent account is linked to Ari Wibowo, whose stable local demo identity is student ID `1` and NIM `2026071001`.

## Repository Structure

```text
issa/
├── server/
│   ├── modules/          # Backend feature modules
│   ├── models/           # Sequelize models
│   ├── migrations/       # Database migrations
│   ├── realtime/         # Authenticated Socket.IO events
│   ├── demo-data/        # Canonical local dataset
│   └── scripts/          # Guarded reset and operational scripts
├── cms-side/
│   └── src/
│       ├── features/     # Teacher workflows
│       └── offline-workspace/
├── client/
│   └── src/
│       ├── features/     # Parent-facing record views
│       └── realtime/
├── docs/
│   └── INTERVIEW_DEMO.md
└── README.md
```

## Known Limitations

- The offline workspace is a foundation, not a fully offline application. Cached Student Detail and durable queue infrastructure exist, but the production Attendance and Journal forms are not fully connected to the offline sync flow.
- The canonical dataset includes only one validated active Evidence asset and no retracted Evidence.
- Activity search results navigate to the dashboard because an Activity detail page does not exist.
- AI generation requires a locally configured provider API key.
- AI output is not assumed to be accurate and must be reviewed by a Teacher before it is saved.
- ISSA does not provide student diagnosis, automated ranking, comparison, or risk scoring.
- The current repository is a local portfolio and interview-ready build, not a claim of production readiness.

## Project Status

**Local portfolio and interview-ready build.**

The active demo slice is designed to show authorized Teacher-to-Parent record flow, grounded AI assistance, realtime invalidation, and deterministic local data. Production deployment, institutional tenancy, and complete offline mutation coverage remain outside the status claimed here.
