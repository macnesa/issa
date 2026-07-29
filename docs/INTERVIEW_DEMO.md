# ISSA Interview Demo

Target duration: **4–5 minutes**

This script is designed for a local demo using the canonical Class 1A dataset. Keep the Teacher CMS and Parent App visible side by side so the handoff remains easy to follow.

## Pre-demo Preparation

### Checklist

- [ ] Local PostgreSQL is running and the development database configuration is correct.
- [ ] Server dependencies are installed and migrations have been applied.
- [ ] The canonical Class 1A dataset has been reset.
- [ ] The Server, Teacher CMS, and Parent App are running on their expected local ports.
- [ ] Teacher login with NIP `2026001001` and password `GuruDemo2026` succeeds.
- [ ] Parent login with NIM `2026071001` and password `OrangTua2026` succeeds.
- [ ] AI environment variables and a local provider API key are available if live generation will be shown.
- [ ] Teacher and Parent browser windows are open side by side.

### Reset the local demo data

```bash
cd issa/server
npm run demo:reset
```

### Start the applications

Run each application in a separate terminal:

```bash
cd issa/server
npm start
```

```bash
cd issa/cms-side
npm run dev -- --port 3100
```

```bash
cd issa/client
npm run dev -- --port 3001
```

Both frontend `.env` files must point `VITE_API_BASE_URL` to the local API origin.

## Demo Flow

### 0:00–0:30 — Product framing

Say:

> Teachers often record attendance, scores, observations, evidence, and feedback in separate places. Parents usually see only the final result, so the context behind a student's development is easily lost. ISSA keeps those factual records connected while preserving the Teacher's human judgment.

Emphasize:

- Data is a signal, not the student's identity.
- ISSA does not rank, diagnose, compare, or assign a risk score to students.
- The Teacher controls what becomes Parent-visible feedback.

### 0:30–1:15 — Teacher dashboard and Ari

1. Log in to the Teacher CMS with the local demo Teacher account.
2. Show the Class 1A dashboard and open **Ari Wibowo**.
3. Briefly point out:
   - Attendance
   - Scores and lesson context
   - Learning Journal
   - active Evidence
   - Feedback history
   - Student Insights
4. Explain that Insights summarize observable record patterns. They are not labels, rankings, or automated judgments.

Suggested line:

> This view keeps the underlying records close to every summary, so a Teacher can check the context instead of treating a single metric as the student.

### 1:15–2:30 — Grounded AI Copilot

1. Open **Grounded Learning Narrative** in Ari's Student Detail.
2. Show the date range, purpose, length, and source-type selection.
3. Select the 30-day period and all source types. The canonical Ari dataset produces approximately **23 source records** for this selection.
4. If the local AI provider is configured, click **Susun draf**.
5. Open at least one citation preview and show that each narrative section points back to an authorized record.
6. Edit one sentence or remove a section to demonstrate Teacher control.
7. Apply the reviewed draft to Feedback only after the confirmation step.
8. Save it through the existing Feedback form.

Explain:

- The server builds the source packet for the selected, authorized student.
- The generated shape is validated with Zod.
- The grounding validator rejects fake references, unsupported numbers, altered direct quotes, diagnosis, ranking, risk scores, and comparisons.
- Generation does not write directly to Feedback or Parent data.

If the provider is unavailable or times out:

1. Do not claim that generation succeeded.
2. Keep the source preview visible.
3. Explain the request, schema, citation, validation, and human-review contract.
4. Continue with existing saved Feedback or reset the local demo after the interview.

Suggested line:

> The provider is optional to this evidence trail. Even when generation is unavailable, the authorized source packet and the rule that only Teacher-saved Feedback reaches the Parent remain unchanged.

### 2:30–3:15 — Parent realtime

1. Move attention to the Parent App logged in as Ari's Parent.
2. Show the updated Feedback without a manual page reload when the realtime connection is active.
3. Show **Recent Changes** and the related student record context.

Explain:

> Socket.IO sends a small authenticated signal that Ari's record changed. The Parent App then refetches the authorized resource over HTTP, so the socket event is not treated as the source of truth.

If realtime is disconnected, refresh or navigate back to the Parent view and state clearly that the HTTP fetch still returns the saved record.

### 3:15–4:00 — Universal Search

1. Return to the Teacher CMS.
2. Open search with `⌘K` on macOS or `Ctrl+K` on another supported keyboard.
3. Search for `pecahan`.
4. Quickly try:
   - `ari`
   - `diagram`
   - `pameran`
   - `izin`
5. Point out grouped Student, Journal, Feedback, Lesson, and Activity results as they appear.
6. Open a Student-related result to show navigation to Student Detail.

Explain:

- Search candidates are limited by the Teacher's authenticated class.
- Ranking uses exact match, prefix match, then contains match.
- The backend—not the command palette—is the authorization boundary and source of truth.
- Lesson results open the schedule view.
- Activity results open the dashboard because there is no Activity detail page yet.

### 4:00–4:30 — Data-limited behavior

1. Open **Dimas Saputra** from the dashboard or search.
2. Show that Dimas has a deliberately limited record, including fewer scores and less narrative context.

Say:

> Missing context is a valid result. The interface and AI workflow should acknowledge it rather than invent a confident story from sparse data.

### 4:30–5:00 — Technical closing

Close with:

- A modular Express and Sequelize backend.
- Role- and class-scoped authorization.
- Authenticated Socket.IO invalidation with HTTP refetch.
- A deterministic, transaction-based local demo reset.
- Schema and grounding validation around AI output.
- A mandatory Teacher review boundary before Parent-visible Feedback.

Suggested final line:

> The point of this build is not to automate judgment. It is to make school records traceable, keep the Teacher in control, and give Parents better context.

## Interview Talking Points

### Why did you build this?

Teacher observations are often fragmented while Parents receive only final outcomes. ISSA demonstrates how a shared, longitudinal record can preserve factual learning context without reducing a student to a score.

### Why not let AI write directly to the database?

Generation can be incomplete or incorrectly worded even when it is grounded. ISSA returns a draft, allows the Teacher to inspect citations and edit it, and only uses the existing Feedback save flow after explicit Teacher confirmation.

### How do you prevent hallucinated citations?

The backend creates reference IDs from authorized database records. Every generated section must use references from that packet. Zod checks the response shape, and the grounding validator rejects unknown references, unsupported numeric claims, and direct quotes that do not exactly match their source.

### How is Teacher data access restricted?

Teacher authentication places the Teacher and class identity in the signed token. Student operations and Universal Search enforce that class scope on the backend. Frontend filtering is presentation, not the security boundary.

### What happens when realtime disconnects?

Realtime is an invalidation channel, not the data source. A connected Parent receives an event and refetches over HTTP. If the socket disconnects, the saved server state remains available through normal HTTP loading or a manual refresh.

### What is currently offline-capable?

The Teacher CMS has a PWA app-shell, cached Student Detail snapshots, IndexedDB stores, a durable mutation queue, sync metadata, and conflict infrastructure. The production Attendance and Journal forms are not yet fully wired into an end-to-end offline mutation flow, so this is an offline foundation rather than full offline support.

### What would you build next?

I would first connect the production Attendance and Journal forms to the existing queue and reconciliation path, then validate recovery with focused offline E2E scenarios. I would also curate additional owned Evidence assets so active and retracted lifecycle cases can be demonstrated without relying on invented external files. Those are next steps, not current capabilities.

## Demo Failure Recovery

### AI provider timeout

- Keep the exact failure visible briefly; do not present it as a successful generation.
- Show the source selection and citation-oriented contract.
- Explain the safe frontend error and mandatory review boundary.
- Continue with already saved canonical Feedback.

### Realtime disconnect

- State that the socket connection is unavailable.
- Refresh the Parent record or navigate away and back.
- Show that HTTP returns the Teacher-saved Feedback because it remains the source of truth.

### Database has not been reset

- Stop the demo rather than improvising record counts.
- Confirm that the configured database is local development.
- Run `npm run demo:reset` from `server/`.
- Log in again because the reset recreates canonical identities and data.

### Search returns no results

- Confirm the Teacher is authenticated and online.
- Use a canonical term such as `ari` or `pecahan`.
- If it remains empty, state that search is unavailable and continue through the dashboard; do not claim that results were returned.

### Evidence asset cannot be loaded

- State that the record metadata is present but its external Cloudinary asset is unavailable.
- Continue with Journal and Feedback source records.
- Do not replace it with an unverified URL during the interview.
