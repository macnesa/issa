# ISSA Server

Express and PostgreSQL backend for the ISSA Parent app and Teacher CMS.

## Public portfolio demo

Public demo access is disabled by default. Enable it only after the synthetic
demo database has been seeded and the two server-owned actor IDs have been
verified:

```env
PUBLIC_DEMO_ENABLED=true
DEMO_TEACHER_ID=<synthetic-demo-teacher-id>
DEMO_PARENT_ID=<synthetic-demo-parent-id>
```

Passwordless authentication endpoints:

- `POST /users/demo-login` — Parent demo access.
- `POST /teachers/demo-login` — Teacher CMS demo access.

Both endpoints accept an empty request only; supplied account or scope fields
are rejected. The Server resolves the configured account itself. Responses
contain a one-hour JWT marked with
`accessMode: "demo"` and do not return an account password.

Demo JWTs may use normal authenticated read endpoints within the configured
Parent or Teacher scope. All persistent HTTP mutations return `403` before
route handlers, upload parsing, storage providers, transactions, or realtime
events run. The only non-read request allowed for a demo JWT is:

- `POST /students/:studentId/ai/narrative-draft`

That endpoint retains Teacher/class authorization, request validation,
provider generation, output-shape validation, grounding validation, and safe
citations. It returns a draft and does not write it to Feedback or any other
table.

If the configured demo identity signs in through the normal password endpoint,
the server still issues demo read-only access. This prevents a known synthetic
credential or an older standard token for that configured identity from
bypassing the write barrier while public demo mode is enabled.

Public demo login requests default to 30 requests per minute per server-visible
IP. Demo AI generation defaults to 5 requests per 10 minutes for the shared
demo Teacher. The optional `PUBLIC_DEMO_*_RATE_LIMIT_*` variables in
`.env.example` can tune these limits. The limiter is process-local; use a
shared provider or gateway limiter when deploying multiple Server instances.

Invalid or incomplete public-demo configuration fails at Server startup.
