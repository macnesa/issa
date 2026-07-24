# ISSA v1.0.0 Deployment Readiness

## Deployable packages

| Package | Artifact / process | Build | Start |
| --- | --- | --- | --- |
| `server/` | Node.js API process | No compile step; run `npm run codebook:check` | `npm start` |
| `client/` | Parent Vite SPA in `dist/` | `npm ci && npm run build` | Serve `dist/` with the selected static host |
| `cms-side/` | Teacher Vite SPA in `dist/` | `npm ci && npm run build` | Serve `dist/` with the selected static host |

Use the Node.js version supported by the selected provider and install from each package lockfile with `npm ci`.

## Environment variables

### Server

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV=production` | Yes | Selects production database and runtime behavior |
| `PORT` | Provider-dependent | HTTP port; defaults to `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `DATABASE_SSL` | No | Defaults to SSL; set `false` only when the database explicitly does not use SSL |
| `JWT_SECRET` | Yes | JWT signing and verification secret |
| `FRONTEND_ORIGINS` | Yes | Comma-separated exact Parent and Teacher origins, without paths |
| `ALLOW_REMOTE_DEMO_BOOTSTRAP` | Bootstrap only | Must equal `true` for the one-time remote demo bootstrap |

Production startup fails fast when `DATABASE_URL`, `JWT_SECRET`, or `FRONTEND_ORIGINS` is absent. Never commit their real values.

### Parent Client

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes when API is on another origin | Public HTTPS base URL of the deployed Server |

### Teacher CMS

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes when API is on another origin | Public HTTPS base URL of the deployed Server |

Both SPAs fall back to their own origin when the API URL is omitted. For independent deployments, set `VITE_API_BASE_URL` during the build.

## Database migration and demo bootstrap

For an existing database, run migrations from `server/`:

```bash
NODE_ENV=production npm exec -- sequelize-cli db:migrate --env production
```

For a new, empty remote PostgreSQL database, use the guarded bootstrap:

```bash
NODE_ENV=production \
ALLOW_REMOTE_DEMO_BOOTSTRAP=true \
DATABASE_URL='postgresql://…' \
DATABASE_SSL=true \
JWT_SECRET='…' \
npm run db:bootstrap-demo
```

The bootstrap verifies the explicit flag, production environment, remote PostgreSQL URL, approved photo fixture, and empty target schema before it runs migrations, the existing JSON seed, and `db:verify-demo`. It never drops a database. `db:reset-demo` remains restricted to recognized local development databases.

The JSON files in `server/data-seeding/` are the single source of truth for the curated demo dataset.

## Routing, CORS, health, and assets

- Server health check: `GET /health`.
- A healthy response is `200` with `{"status":"ok","database":"connected"}`. Database failure returns `503`.
- `FRONTEND_ORIGINS` must contain the exact HTTPS origins of both SPAs. Paths and wildcard origins are not accepted.
- Both static hosts must rewrite unknown application paths to `index.html` so React Router routes survive reloads.
- Student photos are public HTTPS references listed in `server/data-seeding/student-photos.json`; the deployed environment must allow outbound/browser access to `live.staticflickr.com`.
- Parent and Teacher authentication tokens use browser `localStorage`, so sessions persist across normal reloads. The Server remains the authorization authority.

## Demo credentials

These credentials belong only to the curated demo database:

| Role | Identifier | Password |
| --- | --- | --- |
| Teacher | NIP `2026001001` | `GuruDemo2026` |
| Parent | NIM `2026071001` | `OrangTua2026` |

They are also recorded in `server/DEMO_CREDENTIALS.md`. Replace or disable demo credentials before using the deployment for non-demo data.

## Deployment order

1. Choose the final API, Parent, and Teacher HTTPS origins.
2. Provision an empty PostgreSQL database and store all real secrets, including both frontend origins, in provider environment settings.
3. Run `db:bootstrap-demo` once, or migrations only for an existing database.
4. Deploy the Server and verify `GET /health`.
5. Build and deploy Parent Client with the final `VITE_API_BASE_URL`.
6. Build and deploy Teacher CMS with the final `VITE_API_BASE_URL`.
7. Configure SPA rewrites, then smoke-test login, reload persistence, Attendance, Score, and Feedback.

## Basic rollback

- Keep the previous Server release and both previous SPA artifacts available for immediate redeploy.
- Before applying migrations to a database with data, create a provider snapshot or backup.
- Roll back application releases first. Roll back a database migration only when its down migration is known to be safe; otherwise restore the pre-deployment snapshot.
- If the one-time bootstrap fails after migrations begin, discard the incomplete demo database and repeat against a newly created empty database. Do not use `db:reset-demo` remotely.

## Remaining provider decisions

- Node.js hosting/runtime for `server/`.
- Managed PostgreSQL provider, region, backup retention, and SSL requirements.
- Static hosting for `client/` and `cms-side/`, including SPA rewrite syntax.
- Final API, Parent, and Teacher domains, DNS, and TLS.
- Secret generation/storage and production log/monitoring policy.

No provider-specific manifest is included in this sprint.
