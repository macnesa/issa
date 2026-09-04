# Fieldwork Existing Data Contract Audit

**Document status:** DRAFT
**Baseline:** `cms-side-fieldwork-final-reconciliation-v3`
**Audit type:** source-only client contract audit
**Audit date:** 2026-09-04
**Companion contract:** `FIELDWORK_DOMAIN_MODEL.md`

## Executive verdict

`CURRENT DATA MODEL SUPPORTS FIELDWORK V3, BUT NOT A SESSION-CENTRIC OR ANALYTICS-HEAVY PRODUCT YET.`

- `FACT` — The active client already has sufficient explicit records for the current `Hari ini / Siswa / Kelas / Catat` product model without a backend rewrite.
- `FACT` — The strongest current student record families are Attendance, Score, Journal, Evidence, and Feedback.
- `FACT` — The offline workspace is intentionally partial: Student summary + Attendance + Journal are retained; Score, standalone Evidence, and Feedback history are not.
- `FACT` — AI Narrative and Classroom Debrief already encode strong non-canonical draft/review boundaries.
- `FACT` — No inspected client contract exposes an actual `ClassSession`, Class membership lifecycle, academic period, or assessment weighting/comparability semantics.
- `IMPLEMENTED` — The client now centralizes resource/provenance semantics through `src/shared/data/resourceTruth.js` and has migrated Journal, Evidence, Feedback history, and Student composite/Perjalanan truth presentation.
- `RECOMMENDATION` — The next architecture step should inspect the backend repository/schema before any ClassSession, membership, academic-period, or analytics-heavy migration.

This document now records the subsequent client-side Resource Truth implementation. Backend/API/persistence contracts remain unchanged by that implementation.

---

## 1. Audit scope and limitations

### Inspected

- active routes and shell;
- Redux data consumers;
- Student list/detail;
- Attendance;
- Schedule/Kelas;
- Scores;
- Journal;
- Evidence;
- Feedback;
- Classroom Debrief/Catat;
- AI Narrative;
- Teacher Attention;
- offline snapshots, mutations, conflicts, and sync;
- tests as contract evidence where they expose response shapes.

A source import trace from `src/index.jsx` found **90 reachable production files** in the extracted baseline.

### Not available in this ZIP

- backend repository implementation;
- ORM/database schema;
- migrations;
- server validators beyond what the client/test fixtures expose;
- production data dictionary.

Therefore claims about actual database tables, foreign-key constraints, retention, and server-side ownership beyond visible HTTP behavior remain `UNVERIFIED`.

---

## 2. Support vocabulary

| Support state | Meaning |
|---|---|
| `EXPLICIT` | Direct field/API/validation support exists in inspected source |
| `SCOPED_DERIVED` | Can be safely derived only with an explicit population/time/method scope |
| `LOCAL_PARTIAL` | Available only in a partial local/offline representation |
| `NON_CANONICAL` | Draft or decision-support output, not persisted truth |
| `NOT_REPRESENTED` | No inspected contract supports the concept |
| `UNVERIFIED` | May exist on backend, but client source does not prove it |

---

## 3. Active HTTP contract inventory

The list below records endpoints used by active Fieldwork features. It is not a complete backend API inventory.

| Domain | Endpoint observed | Role |
|---|---|---|
| Auth | `POST /teachers/login` | teacher session |
| Auth/demo | `POST /teachers/demo-login` | read-only demo session |
| Student | `GET /students` | paginated/searchable roster |
| Student | `GET /students/:id` | student detail projection |
| Student/Feedback | `PUT /students/:id` | current student update path used for Feedback |
| Feedback | `GET /students/:id/feedbacks` | longitudinal Feedback history |
| Attendance | `POST /attendances` | create Attendance record |
| Attendance | `PUT /attendances` | update Attendance record |
| Score | `POST /scores` | create Assessment record |
| Score | `PUT /scores` | update Assessment record |
| Reference | `GET /lessons` | Lesson choices/context |
| Reference | `GET /assignments` | Assignment choices/context |
| Schedule | `GET /schedules` | recurring class schedule context |
| Journal | `GET /students/:id/journal` | Journal history |
| Journal | `POST /students/:id/journal` | create Journal entry |
| Journal | `PATCH /students/:id/journal/:entryId` | correct Journal entry |
| Journal | `DELETE /students/:id/journal/:entryId` | retract Journal entry |
| Evidence | `GET /students/:id/evidences` | Evidence history |
| Evidence | `POST /students/:id/evidences` | upload Evidence |
| Evidence | `PATCH /students/:id/evidences/:evidenceId` | correct Evidence metadata |
| Evidence | `DELETE /students/:id/evidences/:evidenceId` | retract Evidence |
| Attention | `GET /teachers/me/attention` | derived teacher review signals |
| AI narrative | `POST /students/:id/ai/narrative-draft` | grounded non-canonical narrative draft |
| Catat | `POST /teachers/me/classroom-debrief/drafts` | generate proposed structured records |
| Catat | `POST /teachers/me/classroom-debrief/confirm` | teacher-confirmed persistence boundary |
| Sync | `POST /teachers/me/sync` | batch reconciliation of supported offline mutations |
| Search | `GET /teachers/me/search?...` | global teacher command/search utility |

### Legacy capability note

`src/store/action/ActionCreator.js` contains older CRUD endpoints for classes, teachers, lessons, schedules, history, and transactions. Some corresponding pages are dormant from the current route graph. Their existence is not evidence that Fieldwork should surface those entities as primary navigation.

---

## 4. Domain support matrix

| Concept | Current support | Evidence | What Fieldwork may safely do now | Missing semantics |
|---|---|---|---|---|
| Teacher identity | `EXPLICIT` | JWT/local identity | scope local work and offline records to teacher | full profile/role model `UNVERIFIED` |
| Student | `EXPLICIT` | roster/detail | master-detail subject workspace | membership history/status |
| Current Class context | `EXPLICIT` but nested | Student/Schedule | show current class label/context | authoritative membership lifecycle |
| ClassMembership | `NOT_REPRESENTED` | no inspected relation object | none | start/end/status/history |
| Lesson | `EXPLICIT` | lessons, scores, schedules | label assessment/schedule; show KKM | curricular hierarchy `UNVERIFIED` |
| Assignment | `EXPLICIT` | assignments, scores, Debrief | identify assessment target | weight, max points, term, comparability |
| ScheduleSlot | `EXPLICIT` | schedules | weekly/day schedule presentation | actual session occurrence |
| ClassSession | `NOT_REPRESENTED` | no shared occurrence/session id | none | actual class event identity/lifecycle |
| AttendanceRecord | `EXPLICIT` | student, Attendance, sync | date-scoped status; durable offline update | broader attendance analytics policy |
| Attendance rate | `SCOPED_DERIVED` | attention endpoint | show only with explicit period + recordedDays | generic/global rate not valid |
| AssessmentRecord | `EXPLICIT` | student Scores, score CRUD | individual score history and KKM context | aggregate methodology |
| Academic average | `NOT_REPRESENTED` | no weight/period semantics | none | comparable set + weighting + period |
| AcademicPeriod | `NOT_REPRESENTED` | no term entity in active client | arbitrary date filtering only | school term/semester meaning |
| JournalEntry | `EXPLICIT` | journal API/constants | factual teacher observation history | broader cross-record event taxonomy optional |
| EvidenceRecord | `EXPLICIT` | evidence API | evidence history, metadata, tombstones | standalone offline availability |
| Journal→Evidence link | `EXPLICIT` | `evidenceId`, nested evidence | contextual record link | offline create cannot attach evidence |
| FeedbackRecord | `EXPLICIT` history | feedback endpoint | latest/history presentation | exact server relation to `student.feedback` `UNVERIFIED` |
| AttentionSignal | `NON_CANONICAL` | attention endpoint | review queue / scoped trigger facts | not a diagnosis or canonical status |
| AI Narrative | `NON_CANONICAL` | Zod schema + source refs | cited teacher-reviewed draft | no authority to write canonical data |
| Debrief Draft | `NON_CANONICAL` | Catat | structured proposal + clarification + teacher confirmation | no direct write without confirmation |
| Offline Snapshot | `LOCAL_PARTIAL` | IndexedDB snapshot | degraded read of Student/Attendance/Journal | Scores, Evidence, Feedback unavailable |
| PendingMutation | `LOCAL_PARTIAL` / local intent | mutation queue | expose pending/syncing/failed states | only Attendance update + Journal create supported |
| SyncConflict | `EXPLICIT` local state | sync engine | require reconciliation | transport conflict semantics depend on server result |
| Resource provenance | `EXPLICIT_CLIENT_CONTRACT` | `src/shared/data/resourceTruth.js` | use one status/provenance taxonomy across migrated surfaces | remaining feature migrations can adopt the same envelope incrementally |
| Persistent teacher task | `NOT_REPRESENTED` | no work-item API | derive temporary Hari ini actions | durable task/due/completion semantics |

---

## 5. What the existing model already does well

### 5.1 Journal has explicit observation semantics

`FACT` — Journal distinguishes:

- observation;
- visible strength;
- current challenge;
- milestone;
- student reflection;
- support tried.

The copy explicitly warns against diagnosis/labeling and distinguishes direct student quote from teacher paraphrase.

**Implication:** Do not create a second generic “Observation” object merely because Fieldwork wants better ontology. First decide whether JournalEntry already owns that responsibility.

---

### 5.2 AI Narrative has strong provenance semantics

`FACT` — Narrative generation requires an explicit date range and selected source types. Response data includes source references, source type, observed time, previews, missing context, warnings, and per-section `sourceRefs`.

This gives Fieldwork a concrete pattern for truth-preserving derived content:

```text
claim
→ source reference
→ source type
→ observed date
→ missing context/warning
```

**Recommendation:** future non-AI summaries should follow the same discipline when they derive cross-record statements.

---

### 5.3 Catat already has a human decision boundary

`FACT` — Catat separates:

```text
raw teacher input
→ generated draft
→ student/assessment resolution
→ edit/discard
→ ready/needs clarification
→ explicit confirmation
→ committed/duplicate/failed result
```

This is the correct canonicality architecture. Do not collapse it into “AI writes records.”

---

### 5.4 Offline Attendance has explicit conflict identity

`FACT` — Attendance updates use a stable entity key and server `version` as the base for reconciliation.

This makes “pending,” “server saved,” and “conflicted” different states with real operational meaning.

Any future domain migration involving Attendance must preserve this identity/version behavior or replace it with an equally explicit concurrency contract.

---

## 6. Structural gaps proven by source

### G01 — No ClassSession entity

**Evidence label:** `FACT`
**Impact:** high architectural leverage, not a current defect.

Schedule is recurring. Attendance is keyed by student + date. Catat can receive optional Lesson context. Evidence has observed date. None of those records expose a common actual-session identifier in the inspected client.

Therefore the system cannot currently prove:

> “This attendance, this debrief, and this evidence came from the same class session.”

**Do not solve this with client inference.**

A ClassSession should be evaluated only when the product needs session-scoped workflows strongly enough to justify server/domain work.

---

### G02 — No ClassMembership lifecycle

**Evidence label:** `FACT`

Current UI gets `Student.Class` and sometimes `Schedule.Class`. There is no inspected membership object with effective dates or status.

Consequences:

- do not show an invented “Aktif” enrollment label;
- do not infer historical class membership;
- do not use current Class nesting as an immutable student property.

---

### G03 — No academic period/aggregation contract

**Evidence label:** `FACT`

Score records have lesson, assignment, value, optional KKM/status/category, and record time. The inspected client has no term, weighting, max-score normalization, or comparison group.

Consequences:

- individual Assessment records are valid;
- lesson-specific KKM comparison is valid;
- “overall average,” “semester performance,” or trend claims are not valid without additional scope/methodology.

---

### G04 — Shared Resource Truth Contract implemented; migration remains incremental

**Evidence label:** `FACT` — current client source.

The former fragmented resource-state gap has been addressed by `src/shared/data/resourceTruth.js`. The runtime contract distinguishes:

- loading;
- known;
- empty;
- error;
- unavailable;
- partial;
- pending;
- conflicted;

with explicit provenance (`server`, `snapshot`, `local_pending`, `derived`, `draft`).

Initial migrated surfaces are Journal, Evidence, Feedback history, Student Ringkasan, and Perjalanan composite completeness. Existing API contracts, Redux behavior, and offline mutation/conflict semantics were preserved.

**Remaining work:** other feature surfaces may migrate incrementally when they need the same truth distinction. This is no longer a blocker for the current Student workspace.

---

### G05 — Offline workspace is intentionally asymmetric

**Evidence label:** `FACT`

Offline snapshot persists:

- Student summary;
- Attendance;
- Journal.

It does not persist:

- Scores;
- standalone Evidence;
- Feedback history.

A nested Evidence summary can survive within a JournalEntry, but its file is removed.

Offline mutations support only:

```text
attendance.update
journal.create
```

**Implication:** “offline capable” is not a single boolean property of the Student workspace. Capability is record-family-specific.

---

### G06 — Hari ini does not have canonical work items

**Evidence label:** `FACT`

Current Hari ini derives action surfaces from:

- date-scoped Attendance completeness;
- current weekday Schedule slots;
- `/teachers/me/attention` review signals.

There is no inspected `TeacherTask`, due date, completion record, or decision state.

This is acceptable for the current product, but future promises such as “resume unfinished work across devices” need a real work-item contract rather than another UI card.

---

## 7. Epistemic risk register

| Risk | Current treatment | Required invariant |
|---|---|---|
| Missing numeric input becomes factual zero | fixed through shared score parser | absence remains absence |
| Unavailable snapshot data appears empty | partially corrected in Fieldwork | snapshot must expose unavailable/partial state |
| Cross-assignment score aggregation | removed from Ringkasan | no aggregate without methodology |
| Attendance percentage loses time scope | attention UI states 30-day context + recordedDays | every percentage carries period + denominator |
| Current class becomes enrollment status | hard-coded “Aktif” removed | no status without source |
| Schedule slot becomes actual session | not currently persisted as session | never infer occurrence identity |
| Derived priority becomes student truth | attention copy presents trigger facts | derived signal remains review support |
| AI draft becomes canonical | explicit handoff/confirmation boundary | teacher decision remains required |
| Offline pending mutation appears server-saved | sync labels distinguish states | canonicality must remain visible |

---

## 8. Implementation status and next architecture step

### Phase A — Shared Resource Truth Contract — IMPLEMENTED

The client now ships the shared contract in `src/shared/data/resourceTruth.js` with tests. Initial migration covers:

1. Journal timeline resource;
2. Evidence timeline resource;
3. Feedback history resource;
4. Student snapshot-aware Ringkasan state;
5. Perjalanan composite completeness;
6. Attendance pending/conflict and Score availability as composite inputs.

Acceptance criteria now encoded in runtime behavior:

- `empty` requires successful resolution of the relevant source/scope;
- `unavailable` is distinct from empty;
- snapshot-backed Journal/Attendance data is explicitly partial;
- Perjalanan derives coverage from source envelopes rather than ad-hoc booleans;
- no Redux/API/backend contract changes were required.

### Phase B — Backend repository/schema audit — NEXT RECOMMENDED ARCHITECTURE TASK

Before adding ClassSession or academic-period entities, inspect the actual backend repository for:

- Student/Class associations;
- Schedule model;
- Attendance uniqueness/version rules;
- Score/Assignment/Lesson schema;
- Feedback persistence/history model;
- Journal/Evidence ownership/retraction;
- Debrief confirmation implementation;
- AI source selection;
- authorization scopes;
- database migrations.

Output should be a server-side contract map, not code migration.

### Phase C — Decide whether ClassSession is justified

Only after backend inspection, test whether one explicit session entity would materially improve Attendance context, Catat context, Evidence capture, lesson/session timeline, Hari ini continuation, or future teacher task state. Do not infer sessions client-side by matching dates.

### Phase D — Academic scope only if product needs it

Do not add term/weighting models merely to create prettier analytics. Introduce AcademicPeriod/assessment semantics only when a real workflow requires comparable or weighted academic records.

## 9. What should not be developed next

Based on the inspected contracts, the following would outrun the model:

- generic KPI dashboard;
- overall student “performance score”;
- predictive risk score;
- invented enrollment status;
- automatic causality from attendance to scores;
- session timeline created by matching dates heuristically;
- AI auto-save;
- broad backend rewrite to mirror UI tabs;
- “offline everything” without expanding the offline record-family contract intentionally.

---

## 10. Concrete decision from this audit

### Keep

- Fieldwork IA: Hari ini / Siswa / Kelas / Catat;
- Ringkasan / Perjalanan / Penilaian;
- current canonical record families;
- human-review AI boundaries;
- current offline architecture and conflict model;
- API contracts until backend evidence proves a need to revise them.

### Implemented now

`FACT` — **Shared Resource Truth Contract** is implemented and migrated into the first Student resource surfaces. It strengthens empty/unavailable/partial semantics without changing server contracts.

### Investigate next

`RECOMMENDATION` — perform the backend repository/schema contract audit before deciding whether any new persisted domain object is justified.

### Do not implement yet

`RECOMMENDATION` — defer `ClassSession`, ClassMembership, AcademicPeriod, and assessment aggregation until the backend repository is inspected and the product need is explicit.

---

## 11. Handoff after Resource Truth implementation

The Resource Truth task above is complete in the client. The next architecture task should be bounded to:

```text
inspect backend repository/schema
→ map server-side canonical entities and constraints
→ compare them with FIELDWORK_DOMAIN_MODEL.md
→ identify proven gaps only
→ no schema migration yet
→ no ClassSession inference in the client
```

This audit still does not authorize any further domain migration.
