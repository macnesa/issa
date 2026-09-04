# Fieldwork Domain & Truth Model

**Document status:** DRAFT
**Decision ID:** DEC-TECH-001
**Decision status:** DRAFT
**Baseline inspected:** `cms-side-fieldwork-final-reconciliation-v3`
**Audit date:** 2026-09-04
**Authority:** user-facing domain semantics, canonicality boundaries, time semantics, and UI truth rules for the Fieldwork teacher CMS.

This document does **not** authorize a backend migration. It records what the current client can prove from its active source and defines the semantic contract future implementation should preserve or deliberately revise.

The source-only audit traced imports from `src/index.jsx` and found 90 reachable production files. The inspected ZIP contains the teacher CMS client, not the backend schema or database migrations. Therefore backend persistence details that are not visible through client contracts remain `UNVERIFIED`.

---

## 1. Core model

Fieldwork should model the teacher's work around **subjects, contexts, records, and decisions**, not around page names.

```text
Teacher
  ├─ works within → Class context
  │                  ├─ recurring context → Schedule Slot
  │                  │                     └─ Lesson
  │                  └─ contains/currently exposes → Students
  │
  └─ works with → Student
                   ├─ Attendance Record
                   ├─ Assessment Record
                   ├─ Journal Entry
                   │    └─ may reference → Evidence Record
                   ├─ Evidence Record
                   └─ Feedback Record

Teacher input
  └─ Catat / Classroom Debrief
       └─ Debrief Drafts (non-canonical)
            └─ teacher review + confirmation
                 └─ canonical student records

Canonical student records
  └─ AI Narrative Draft (derived, cited, non-canonical)
       └─ teacher review
            └─ may be handed to Feedback editor

Canonical / derived server data
  └─ local workspace projection
       ├─ partial Snapshot
       ├─ Pending Mutation
       └─ Sync Conflict
```

The most important distinction is:

> **A page is not a domain object. A projection is not a canonical record. A draft is not a fact. Missing data is not an empty history.**

---

## 2. Canonicality classes

Every Fieldwork datum should be understood as one of these classes before the UI makes a claim from it.

| Class | Meaning | Current examples | UI rule |
|---|---|---|---|
| `CANONICAL_SERVER_RECORD` | A persisted domain record returned by an authoritative server endpoint | Attendance, Score, Journal Entry, Evidence, Feedback | May be stated as a record, within the returned scope |
| `SERVER_DERIVED_SIGNAL` | A server-produced interpretation or prioritization derived from records | `/teachers/me/attention` priority + flags | Present as decision support with its scope; never as diagnosis or canonical student fact |
| `NON_CANONICAL_DRAFT` | Generated or locally edited material not yet persisted as a record | AI Narrative draft, Classroom Debrief draft | Must be visibly draft; teacher remains final decision maker |
| `LOCAL_INTENT` | A teacher mutation stored locally before server confirmation | `attendance.update`, `journal.create` pending mutation | Present as pending/local, not “saved on server” |
| `PARTIAL_LOCAL_SNAPSHOT` | Cached minimum read model for degraded/offline use | Student summary + Attendance + Journal | Must expose partial/unavailable boundaries |
| `SYNC_CONFLICT` | A divergence between local intent and server record requiring reconciliation | Attendance sync conflict | Must not silently select local or server truth |
| `UI_PROJECTION` | A composition of multiple records for a teacher task | Hari ini, Ringkasan, Perjalanan, Kelas workspace | May organize facts; may not invent new facts or causal meaning |

### Canonicality rule

A datum may move from one class to another only through an explicit domain transition. For example:

```text
AI draft
  ≠ Feedback record

Debrief score draft
  ≠ Score record

Pending attendance mutation
  ≠ server-confirmed Attendance record
```

A visual success state must never erase this distinction.

---

## 3. Current domain objects

The following model is grounded in active client source and tests. Optionality means “the client does not always receive or require the field,” not necessarily “the backend schema marks it nullable.”

### 3.1 TeacherActor

**Evidence:** `FACT` — `src/offline-workspace/authIdentity.js`, Login flow, authenticated API headers.

**Current visible contract:**

```text
TeacherActor
- id: positive integer
- name: string, may be locally retained as last-known display name
- role: "teacher" in the session payload
- accessMode: string; "demo" has explicit read-only meaning
- exp: token expiry timestamp
```

**Truth boundary:** This is an authenticated actor identity, not a complete Teacher profile model.

**UNVERIFIED:** teacher-to-class assignment schema, teacher employment state, teacher role hierarchy beyond the current teacher session.

---

### 3.2 Student

**Evidence:** `FACT` — `GET /students`, `GET /students/:id`, `StudentsWorkspace`, `AddStudent`, tests.

**Fields consumed by active Fieldwork:**

```text
Student
- id
- NIM
- name
- imgUrl?                 // presentation asset when available
- Class?                  // current nested class context
- Attendances[]?          // detail/list projections can include records
- Scores[]?               // detail projection
- feedback?               // legacy/current feedback value used as fallback
```

**Current role:** the central subject of the `Siswa` workspace.

**Important limit:** `Student.Class` proves only that a class object is nested in the current response. It does **not** prove historical membership, enrollment status, start/end dates, or current administrative status.

---

### 3.3 Class

**Evidence:** `FACT` — nested `Student.Class`, `Schedule.Class`, legacy class endpoints.

**Fields proven in active UI:**

```text
Class
- id?
- name
```

The Fieldwork `Kelas` workspace currently assembles class context from student and schedule responses.

**NOT REPRESENTED:** explicit `ClassMembership` history or enrollment lifecycle.

---

### 3.4 Lesson

**Evidence:** `FACT` — `/lessons`, Score, Schedule, Debrief.

```text
Lesson
- id
- name
- KKM?
```

`KKM` is meaningful in the context of the lesson and individual score evaluation.

**Prohibited inference:** KKM does not make scores across different lessons comparable.

---

### 3.5 Assignment / Assessment Definition

**Evidence:** `FACT` — `/assignments`, Score creation, Debrief assessment resolution.

```text
Assignment
- id / assignmentId
- name
- type?                   // visible in Debrief candidate fixtures
```

The existing object identifies an assessment target for a score.

**NOT REPRESENTED in inspected client contract:** weight, maximum points, term/semester, assessment group, learning objective, normalization rule, or comparability rule.

Because those semantics are absent, Fieldwork must not calculate a cross-assignment or cross-lesson “overall average” as an academic truth.

---

### 3.6 ScheduleSlot

**Evidence:** `FACT` — `GET /schedules`, `Schedule`, `ClassWorkspace`, `Dashboard`.

Observed consumer fields include:

```text
ScheduleSlot
- id?
- day                     // Monday ... Friday etc.
- time? / startTime? / start_time?
- endTime?
- Class?
- Lesson?
- Teacher?
```

This object is best named **ScheduleSlot** in the Fieldwork domain model because the inspected client treats it as a recurring weekly schedule definition.

**Critical boundary:** A ScheduleSlot is **not** a `ClassSession` occurrence.

The current system has no inspected entity that says:

```text
"Class 1A + Matematika + 2026-09-04 09:00–10:00" = one actual instructional session
```

Therefore Attendance, Catat, Evidence, and Schedule must not be assumed to share one session identity today.

---

### 3.7 AttendanceRecord

**Evidence:** `FACT` — student detail/list data, Attendance workflow, offline sanitizers/sync.

```text
AttendanceRecord
- id
- StudentId / studentId
- attendanceDate
- status
- version                 // required for durable offline update conflict control
- createdAt?
- updatedAt?
- recordedAt?             // appears in some response/test shapes; not the offline identity
```

Canonical statuses used by the client:

```text
Hadir
Sakit
Izin
Alfa
```

**Identity used by offline reconciliation:**

```text
attendance:{studentId}:{attendanceDate}
```

**Safe derived claim:** attendance completeness for a specified date is valid only when the student scope is known complete and each record is scoped to that date.

**Scoped server-derived metric:** `/teachers/me/attention` may return an attendance rate with `recordedDays` and an explicit 30-day review context. That scoped signal must not be generalized into a timeless attendance rate.

---

### 3.8 AssessmentRecord / Score

**Evidence:** `FACT` — Score create/edit/history source and tests.

```text
AssessmentRecord
- id
- value                   // integer 0–100 in current client validation
- status?                 // boolean -> Lulus / Belum lulus presentation
- category?               // optional predicate/category returned by server
- recordedAt?
- createdAt?
- Lesson?
  - name
  - KKM?
- Assignment?
  - name
```

Write contract observed from client:

```text
create
- StudentId
- LessonId
- AssignmentId
- value: integer 0–100
- recordedAt?             // optional explicit timestamp

update
- ScoreId
- value: integer 0–100
- recordedAt?             // optional
```

**Truth rule:** empty input is not zero. `parseScoreInput` now preserves that distinction.

**Prohibited inference:** no weighted average, trend, or overall performance score unless a future contract defines comparison scope and methodology.

---

### 3.9 JournalEntry

**Evidence:** `FACT` — Journal API, constants, offline snapshot, tests.

```text
JournalEntry
- id
- studentId
- type
- content
- voiceCaptureType?
- observedAt
- teacher?
  - id
  - name
- evidence?               // optional linked Evidence summary
- createdAt?
- updatedAt?
- wasEdited?
```

Current semantic types:

```text
observation
strength
challenge
milestone
student_reflection
support_note
```

For `student_reflection`, current capture semantics are:

```text
direct_quote
paraphrased
```

This is currently the strongest explicit ontology for teacher observation in the client. Its helper text intentionally distinguishes observed behavior from diagnosis or labeling.

**Offline support:** Journal create is supported as a local pending mutation, but an offline Journal mutation may not attach `evidenceId`.

---

### 3.10 EvidenceRecord

**Evidence:** `FACT` — Evidence API, upload/metadata/view/retraction components and tests.

```text
EvidenceRecord
- id
- title
- category
- description?
- observedAt
- availability?
- teacher?
  - name
- file?
  - url
  - format
  - size
- retractionReason?        // may exist server-side; intentionally hidden in some tombstone views
```

Current categories:

```text
work
assignment
assessment
activity
documentation
```

Upload validation proves current client support for JPEG, PNG, and WEBP up to 5 MB.

Evidence may be referenced by a JournalEntry. A retracted evidence record can remain represented as a tombstone without exposing its file or retraction reason.

**Offline boundary:** standalone Evidence records are not included in the minimum student snapshot. A sanitized evidence summary may survive only when nested inside a cached JournalEntry, with `file: null`.

---

### 3.11 FeedbackRecord

**Evidence:** `FACT` — `GET /students/:id/feedbacks`, student update flow, Feedback history UI.

History items are consumed as:

```text
FeedbackRecord
- id
- content
- Teacher?
  - name
- observedAt?
- createdAt?
```

The edit/save flow currently sends:

```text
PUT /students/:id
- feedback
- observedAt?             // optional explicit observation timestamp
```

and then refreshes `/students/:id/feedbacks`.

`student.feedback` is still used as a fallback current value. The history endpoint should be treated as the stronger source for longitudinal Feedback presentation.

**UNVERIFIED:** exact backend persistence relation between `Student.feedback` and Feedback history records.

---

### 3.12 ClassroomDebriefDraft

**Evidence:** `FACT` — Classroom Debrief source and tests.

A generated Debrief draft contains concepts such as:

```text
- draftId
- type: attendance | feedback | journal | score
- state: ready | needs_clarification | ...
- sourceExcerpt
- studentReference
- studentResolution
  - status
  - student?
  - candidates[]
- payload
- clarificationReasons[]
- context
  - class?
  - lesson?
  - assessmentResolution?
```

This is explicitly `NON_CANONICAL_DRAFT`.

Teacher confirmation transforms selected, valid drafts into confirmation items with a new `clientMutationId`, a resolved student, a `recordType`, source excerpt, and record-specific payload.

Observed confirmation result statuses include:

```text
committed
duplicate
failed
```

The draft must remain reviewable when a partial confirmation fails.

---

### 3.13 AiNarrativeDraft

**Evidence:** `FACT` — Zod schema, API, workspace tests.

Request:

```text
- dateFrom
- dateTo
- sourceTypes[]: attendance | score | journal | evidence | feedback
- length: short | medium
```

Response data includes:

```text
- generatedAt
- student
- period
  - dateFrom
  - dateTo
- sourceSummary
- sources[]
  - sourceRef
  - sourceType
  - label
  - observedAt
  - preview
- narrative
  - title
  - sections[]
    - sectionType
    - text
    - sourceRefs[]
    - directQuote?
  - missingContext[]
- warnings[]
```

This is a strong provenance contract: generated statements can point back to concrete source references, the period is explicit, and missing context is first-class.

**Canonicality rule:** an AI Narrative remains a draft even after local edits. It becomes a candidate Feedback value only after explicit teacher handoff, and Feedback itself changes only after teacher save.

---

### 3.14 TeacherAttentionSignal

**Evidence:** `FACT` — `GET /teachers/me/attention`, UI and tests.

Observed shape:

```text
AttentionSignal
- student
- priority: high | medium | low
- flags[]
```

Observed flag types include:

```text
attendance_attention
academic_attention
feedback_stale
```

Examples of scoped fields include attendance `rate` + `recordedDays`, lesson name, latest scores, KKM, and age of latest feedback.

This is `SERVER_DERIVED_SIGNAL`, not a canonical student record.

The UI may say “perlu ditinjau” and show the scoped fact that triggered review. It must not translate priority into diagnosis, personality, capability, risk label, or causal explanation.

---

### 3.15 OfflineWorkspaceSnapshot

**Evidence:** `FACT` — `studentDetailSnapshot.js`, `workspaceSnapshots.js`, tests.

Minimum snapshot:

```text
OfflineWorkspaceSnapshot
- teacherId
- studentId
- studentSummary
  - id
  - NIM
  - name
  - Class { id, name }?
- attendanceRecords[]
- journalEntries[]
- cachedAt
- updatedAt
```

The snapshot is deliberately partial.

`studentFromSnapshot()` constructs:

```text
Attendances = cached attendance
Scores = []
```

The empty `Scores` array is a transport/projection convenience, **not evidence that the student has no scores**.

Standalone Evidence and Feedback history are not stored in the minimum snapshot.

Maximum retained snapshots per teacher: 10.

---

### 3.16 PendingMutation and SyncConflict

**Evidence:** `FACT` — mutation queue, sync engine, sync API.

Currently supported offline mutation types:

```text
attendance.update
journal.create
```

A pending mutation records:

```text
- clientMutationId
- teacherId
- type
- entityKey
- payload
- baseVersion?            // attendance update
- createdAt
- attemptCount
- nextAttemptAt
- status
- lastErrorCode?
- lastErrorMessage?
- updatedAt
```

Sync outcomes observed in the client include:

```text
applied
duplicate
conflict
rejected
pending/retry
```

A sync conflict stores both the original mutation and conflict payload until the teacher/system resolves it.

---

## 4. Relationship contract

Current supported relationships:

```text
Student ── current nested context ──> Class
Student ── 1:N ──> AttendanceRecord
Student ── 1:N ──> AssessmentRecord
Student ── 1:N ──> JournalEntry
Student ── 1:N ──> EvidenceRecord
Student ── 1:N ──> FeedbackRecord
JournalEntry ── 0:1 ──> EvidenceRecord
AssessmentRecord ── N:1 ──> Lesson
AssessmentRecord ── N:1 ──> Assignment
ScheduleSlot ── N:1 ──> Class
ScheduleSlot ── N:1 ──> Lesson
ScheduleSlot ── N:1 ──> Teacher
DebriefDraft ── resolves ──> Student
DebriefDraft(score) ── resolves ──> Lesson + Assignment
AiNarrativeDraft ── cites ──> Attendance/Score/Journal/Evidence/Feedback sources
```

### Missing relationship that must not be invented

```text
ScheduleSlot ─X─> actual ClassSession ─X─> Attendance / Catat / Evidence
```

There is currently no inspected shared session identifier.

---

## 5. Time semantics

Different timestamps mean different things and must not be silently collapsed.

| Field | Domain meaning currently supported | Typical records |
|---|---|---|
| `attendanceDate` | Effective school date of attendance | Attendance |
| `observedAt` | When the teacher/evidence says the observed event happened | Journal, Evidence, Feedback |
| `recordedAt` | Explicit record/assessment timestamp when provided | Score; appears in some Attendance shapes |
| `createdAt` | Persistence creation time | Journal, Feedback, other records when returned |
| `updatedAt` | Persistence change time | Journal, Attendance snapshot |
| `cachedAt` | When an offline snapshot was captured | Offline snapshot |
| `day` + `startTime/endTime` | Recurring schedule definition | ScheduleSlot |
| `generatedAt` | Generation time of a non-canonical AI draft | AI Narrative |

### Timeline rule

`Perjalanan` is a cross-source chronological **projection**, not a canonical event log. It may sort records by their domain-relevant effective time and use `createdAt` only as fallback, but it must preserve source type and must expose partial/unavailable source state.

---

## 6. Epistemic state contract

Fieldwork needs a consistent vocabulary for “what the interface knows.” The current code already implements parts of this in individual features; this section defines the shared target contract.

| State | Meaning | Allowed UI claim |
|---|---|---|
| `LOADING` | Requested source has not resolved yet | “Sedang dimuat” |
| `KNOWN` | Required source resolved and the fact exists | State the fact with its scope/time |
| `EMPTY` | Authoritative request succeeded for a known scope and returned no records | “Belum ada … pada cakupan ini” |
| `ERROR` | The source request failed | “Belum dapat dimuat” + retry when meaningful |
| `UNAVAILABLE` | The current mode/source does not contain this data | “Tidak tersedia dalam snapshot/mode ini” |
| `PARTIAL` | Some relevant sources or records are available, but completeness is not established | State what is available and disclose the missing scope |
| `PENDING_SYNC` | Teacher intent exists locally but is not yet confirmed by server | “Tersimpan di perangkat / menunggu sinkronisasi” |
| `CONFLICTED` | Local and server versions disagree | “Perlu ditinjau”; do not silently choose a version |
| `DRAFT` | Generated/local material is not canonical | “Draf”; require teacher review before persistence |
| `STALE` | Data is known to be older than an approved freshness threshold | Disclose timestamp/freshness |

### Current implementation note

`STALE` is a valid target state because snapshots expose `cachedAt`, but the inspected project does not define a global staleness threshold. Treating a snapshot as stale after a particular duration is therefore `UNVERIFIED` until an explicit policy exists.

### Empty-state proof rule

The UI may say “Belum ada X” only when:

1. the source request for X succeeded;
2. the scope is known;
3. the returned collection is complete for that scope; and
4. the source is authoritative for the claim.

Otherwise use `UNAVAILABLE`, `ERROR`, or `PARTIAL`.

---

## 7. Fieldwork product projections

These are **UI projections**, not new persistent domain objects.

### Hari ini

Purpose: answer “what needs attention or continuation now?”

Current inputs:

- complete teacher roster assembled across `/students` pages;
- Attendance records for the active date embedded in roster responses;
- `/schedules` filtered to the current weekday;
- `/teachers/me/attention` derived signals.

Allowed claims:

- roster count for the loaded teacher scope;
- attendance completion for the explicit active date when roster completeness is established;
- schedule slots for the current weekday;
- count/list of server-derived review signals.

Not yet represented:

- canonical teacher tasks;
- deadlines;
- “done” state for arbitrary work;
- actual ClassSession occurrences.

---

### Siswa

Purpose: preserve roster context while the teacher works with one student subject.

The roster and selected record are two projections over the same Student domain, not separate domain destinations.

Search changes the roster scope; it does not itself select a different Student.

---

### Ringkasan

Purpose: present the most recent **factual** student context.

Allowed:

- latest attendance record + date;
- latest assessment record + lesson/assignment context;
- latest Journal observation/note when loaded;
- latest Feedback when loaded;
- explicit data availability state.

Not allowed without new contracts:

- overall academic average;
- unscoped attendance rate;
- student “active” status;
- causal statements about performance or attendance;
- inferred personality/diagnosis.

---

### Perjalanan

Purpose: read the student's longitudinal record across record families.

Current event families:

```text
Attendance
Journal
Evidence
Feedback
Assessment
```

Perjalanan is not itself persisted. Its completeness equals the completeness of all contributing resource states.

A Timeline with loaded Attendance + Journal but failed Evidence is `PARTIAL`, not `EMPTY` or fully known.

---

### Penilaian

Purpose: inspect and edit AssessmentRecord history.

Current server contract supports individual score values, lesson/assignment context, KKM presentation, and optional record timestamps.

No current contract supports aggregated academic performance across records.

---

### Kelas

Purpose: provide a stable class-level work context around roster, Attendance, and Schedule.

Current implementation can assemble a current class label and recurring schedule context.

It must not imply the existence of an actual session entity until `ClassSession` exists.

---

### Catat

Purpose: transform free-form classroom reality into proposed structured records while keeping the teacher as the canonical decision maker.

```text
Teacher note
→ generated DebriefDraft[]
→ student/assessment clarification
→ teacher edit/discard/select
→ explicit confirmation
→ canonical record result
```

AI/provider output alone has no authority to create a student fact.

---

## 8. Prohibited epistemic transformations

These are contract violations even if the resulting UI looks more informative.

```text
empty score input
→ 0
```

```text
source unavailable
→ "no records exist"
```

```text
offline snapshot Scores=[]
→ "student has no scores"
```

```text
scores from unrelated lessons/assignments
→ one overall average
```

```text
attendance records without an explicit period/completeness proof
→ global attendance percentage
```

```text
Student.Class present
→ enrollment status = Active
```

```text
ScheduleSlot
→ actual class session occurred
```

```text
attention priority
→ diagnosis / risk truth / causal explanation
```

```text
AI narrative / Debrief draft
→ canonical record without teacher confirmation
```

```text
createdAt
→ observedAt when the domain provides a different effective-time field
```

---

## 9. Missing domain concepts

These are not defects by themselves. They are boundaries where future product behavior would require more than UI composition.

### 9.1 ClassSession — highest leverage missing concept

**Evidence:** `FACT` that no inspected client contract exposes a shared session identity; `RECOMMENDATION` to introduce only if session-centric product workflows are approved.

Potential semantics:

```text
ClassSession
- id
- classId
- lessonId
- teacherId
- scheduledSlotId?
- startsAt
- endsAt?
- state: scheduled | in_progress | completed | cancelled ?
```

Potential relationships:

```text
ClassSession
  ├─ Attendance records
  ├─ Catat source context
  ├─ Evidence captured in the session
  └─ later Assessment/Journal references when appropriate
```

Do not implement these fields until backend/domain ownership confirms the real lifecycle.

---

### 9.2 ClassMembership / enrollment lifecycle

Current `Student.Class` is not enough to answer:

- when the student joined the class;
- whether the relationship is current or historical;
- transfers;
- enrollment status.

A future model may need a relationship object instead of treating class as a timeless property of Student.

---

### 9.3 AcademicPeriod / term

A period entity is required before Fieldwork can make academically meaningful longitudinal claims such as:

- “semester attendance”;
- “term assessment summary”;
- comparison of like-for-like assessments.

The AI Narrative request already accepts an explicit arbitrary date range; that does not create an academic-period ontology.

---

### 9.4 Assessment semantics

`Assignment` currently identifies an assessment, but inspected client contracts do not expose weighting, maximum points, rubric, term, learning objective, or comparability.

Do not create aggregate assessment metrics until the domain defines which records may be combined and how.

---

### 9.5 TeacherWorkItem / DecisionState

`Hari ini` currently derives actionable surfaces from Attendance completeness, Schedule, and attention signals.

There is no inspected canonical object for:

```text
unfinished task
teacher decision required
review completed
due date
assigned owner
```

If the product later needs persistent teacher workflows across sessions/devices, this may require an explicit work-item model. Do not manufacture one from visual cards alone.

---

### 9.6 Shared resource/provenance envelope

`IMPLEMENTED CLIENT CONTRACT` — Fieldwork now centralizes resource truth semantics in `src/shared/data/resourceTruth.js`. This is a client projection contract, not a persisted backend entity.

```text
ResourceState<T>
- status: loading | known | empty | error | unavailable | partial | pending | conflicted
- data: T
- provenance: server | snapshot | local_pending | derived | draft
- reason?
- scope?
- updatedAt?
- meta?
```

The first migration covers Journal, Evidence, Feedback history, Student Ringkasan source presentation, and Perjalanan composite completeness. Attendance pending/conflict state and Score availability contribute to the same composite contract without changing their existing business/offline behavior.

The core runtime rule is now executable: `empty` is only valid after successful resolution of the relevant source/scope; `error`, `unavailable`, and snapshot-limited data cannot silently collapse to an empty-history claim.

---

## 10. Migration and implementation guardrails

1. **Additive before destructive.** Do not rename or remove server fields merely to match Fieldwork vocabulary.
2. **Inspect backend source/schema first.** The current ZIP only proves client contracts.
3. **No silent canonicality changes.** Drafts, snapshots, local intents, and derived signals retain their class.
4. **Preserve offline keys/versioning.** Attendance identity and `baseVersion` are part of conflict safety.
5. **Preserve AI source provenance.** `sourceRef`, period, warnings, and missing context are product truth mechanisms, not decorative metadata.
6. **No new metric without scope.** Any aggregate must define population, period, denominator, and comparison methodology.
7. **No new status without a source.** Administrative labels require a real field/relationship.
8. **Time fields keep their meaning.** `observedAt`, `recordedAt`, `attendanceDate`, and persistence timestamps are not interchangeable.
9. **UI projections remain replaceable.** Hari ini, Ringkasan, Perjalanan, and Kelas can evolve without forcing storage schema to mirror screen composition.
10. **Backend changes require a separate decision.** This DRAFT model does not authorize schema/API migration.

---

## 11. Decision boundary

### Supported now without backend redesign

- current Fieldwork IA;
- factual latest-record Ringkasan;
- cross-source Perjalanan with explicit partial/unavailable state;
- assessment history without unsupported aggregation;
- class context assembled from current Student/Schedule responses;
- Catat human-review pipeline;
- AI Narrative citations/provenance;
- shared frontend resource-state semantics;
- clearer provenance labels for snapshot/pending/derived/draft data.

### Requires backend/schema evidence before implementation

- ClassSession;
- ClassMembership lifecycle;
- academic term/period semantics;
- weighted/comparable assessment aggregation;
- authoritative enrollment/student status;
- persistent teacher work items/decision completion state;
- any new cross-record causal or predictive claim.

---

## 12. Approval state

This document is **DRAFT**.

It may be used immediately as an audit and implementation constraint against fabricated UI claims. It must not be treated as approval to migrate persistence, alter backend contracts, or introduce the proposed missing entities.

The Shared Resource Truth Contract described by the prior audit is now implemented in the client. The next architecture decision remains bounded by `FIELDWORK_DATA_CONTRACT_AUDIT.md`: inspect backend/schema evidence before authorizing entities such as `ClassSession`, `ClassMembership`, or `AcademicPeriod`.
