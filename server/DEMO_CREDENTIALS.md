# ISSA Curated Demo Access

The curated database is synthetic and intended for local development or a
read-only portfolio deployment.

Public visitors must use the passwordless endpoints:

- `POST /teachers/demo-login`
- `POST /users/demo-login`

The Server selects the configured synthetic identities from
`DEMO_TEACHER_ID` and `DEMO_PARENT_ID`. Do not publish, embed, or send an
account password from the public frontend.

Run `npm run db:reset-demo` from `server/` to recreate the deterministic local
dataset.
