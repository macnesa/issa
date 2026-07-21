# Executive Summary

ISSA is a small but meaningful 2023-era school-service backend. It is JavaScript on Node.js, Express 4, PostgreSQL, Sequelize 6, JWT, Socket.IO 4, and Midtrans Snap. The repository contains 54 active HTTP route declarations, 13 migrations, 12 active seeders, 14 seed-data files, and 11 Jest/Supertest suites. All 40 endpoint paths named by the two frontends are present in some form.

That route coverage does **not** mean the backend is ready to run or safe to expose. Static analysis found one packaging/startup blocker and nine P1 core/security blockers. The highest-impact facts are:

- `package.json` points `main` to missing `index.js` and defines no `start`/`dev` script. `app.js` is the real entry-like file.
- Authentication exists, but authorization is effectively absent. `middlewares/authorization.js` is only a commented template. Teachers can address unrelated students/classes, parents can request payment for arbitrary student IDs, REST chat history accepts arbitrary participant IDs, and Socket.IO has no authentication.
- JWTs use a hardcoded signing value, contain only an NIM/NIP string, and have no expiry. Several other credentials are committed in code/config/seed data. Values are intentionally redacted in this audit and must be rotated before any public demo.
- Teacher schedule reads are statically broken: `controllers/scheduleController.js` uses `Lesson` without importing it, and filters `ClassId` with a teacher ID.
- Parent transaction/statistic code confuses `User.id` with `Student.id`; it may appear to work only when seeded IDs happen to align.
- The payment implementation is not a complete payment system: a sandbox server credential is hardcoded, any authenticated parent can choose a student ID, there is no webhook verification or order persistence, and a client-authenticated PATCH can mark a transaction paid.
- Chat messages are persisted, but room IDs and participant IDs are client-controlled; REST and Socket.IO derive rooms differently, Socket.IO permits unauthenticated joins, and collision/impersonation risks are visible.
- Model/migration/seed drift is material. Examples include omitted `Activity.desc` and `Teacher.imgUrl` model attributes, string/integer type disagreements, a missing Uniform migration, and an attendance seeder that overwrites historical `createdAt` dates.
- Tests exist and show intended contracts, but they were not run. They directly mutate/truncate a database, the user-login suite is commented out, chat/payment lack suites, and importing `app.js` also starts a listening server.

**Conclusion:** the business/domain breadth is portfolio-worthy, and a limited revival is feasible in 1–2 focused weeks. A full restoration including real payment and real-time chat is too risky for that window. Preserve the Express/Sequelize core, fix a narrow route set, use deterministic demo data, replace payment with a safe status stub, and hide or defer chat unless extra time remains.

## Fact versus inference convention

- **Verified fact** means directly visible in repository code/configuration.
- **Inference** means a likely consequence or intent derived from code.
- **Runtime verification required** means execution, a real database, dependency installation, frontend inspection, or an external service would be needed to confirm it.

# Final Verdict

## B. Revive original backend with limited scope

The existing backend is worth reviving for a constrained live portfolio demo. It already expresses credible school-domain relationships and exposes every expected frontend path. Rewriting the whole backend would discard useful evidence and consume the 1–2 week budget, while exposing the current payment/chat/authorization behavior would be unsafe.

The recommended decision is to retain Express, Sequelize, PostgreSQL, the current route names, and a reduced domain schema; repair only login/profile/student/attendance/score/schedule/activity flows; seed synthetic demo data; stub payment status; and hide chat unless its authentication and room model can be corrected after the core demo is stable.

- Original backend revival likely: **yes, with limited scope**.
- Full original feature revival in 1–2 weeks: **no**.
- Confidence in verdict: **high for code structure and static defects; medium for actual runtime/frontend compatibility**.

# Audit Limitations

This was static code analysis only. No dependencies were installed; no server, tests, migrations, or seeders were run; no database or external API was contacted; and no source code was changed. The only created file is this requested audit.

Consequently:

- Dependency resolution, Node compatibility, PostgreSQL behavior, migration success, seed success, query results, Socket.IO interoperability, Midtrans responses, email delivery, and test outcomes are **runtime verification required**.
- The frontend repositories were not present in this server workspace. Compatibility is evaluated against the endpoint/field expectations supplied in the audit request plus server-side tests; exact frontend payload handling remains **runtime verification required**.
- File existence is not treated as proof that a feature works.
- Secret/credential values are not reproduced. Any mentioned committed credential is shown only as `<redacted>`.
- No internet/package-registry research was performed. “Old” means pinned to the 2023 lockfile or architecturally stale in this repository; it is not a claim about the latest upstream release.

# Tech Stack

| Item | Verified repository evidence | Assessment |
|---|---|---|
| Runtime/language | CommonJS JavaScript; Node-style `require`; `package.json` | Node.js; no TypeScript |
| Backend framework | `express` 4.18.2 in lockfile | Express 4 |
| Package manager | `package-lock.json`, lockfile v2 | npm, probably npm 7/8 era |
| Probable Node version | No `engines`, `.nvmrc`, or `.node-version`; Jest 29 requires Node 14.15/16.10/18+ ranges | Most likely Node 16 or 18 during 2023 development; exact version unknown and runtime verification required |
| Entry point | `app.js` constructs Express/HTTP/Socket.IO and listens; `package.json.main` says missing `index.js` | Actual entry is probably `app.js`; packaging is broken |
| Database | `pg`, PostgreSQL dialect in `config/config.json` | PostgreSQL |
| ORM | Sequelize 6.29.0 and sequelize-cli 6.6.0 | Sequelize 6 |
| Authentication | `jsonwebtoken` 9.0.0; custom `access_token` header; bcryptjs 2.4.3 | Stateless JWT lookup plus bcrypt password hashes |
| Realtime | Socket.IO server 4.6.1 in `middlewares/socketio.js` | Socket.IO, not raw WebSocket |
| Payment | `midtrans-client` 1.3.1, Snap sandbox mode | Incomplete Midtrans Snap sandbox integration |
| Email | Nodemailer 6.9.1, Gmail transport | Payment-triggered email side effect; unsafe configuration |
| Deployment | Production Sequelize profile reads `DATABASE_URL` with SSL; no Docker, Procfile, hosting manifest, or CI | Intended generic managed PostgreSQL deployment; actual platform unknown |
| Tests | Jest 29.5.0 and Supertest 6.3.3; 11 suites | Integration-style database tests; not executed |

# Repository Architecture

## Request/initialization flow

1. `app.js` conditionally loads `.env` outside production, creates Express, installs URL-encoded/JSON parsing and unrestricted CORS, mounts `routes/index.js`, creates an HTTP server, attaches Socket.IO, calls `listen`, then registers the error handler.
2. `routes/index.js` mounts parent/public/auth/chat routes, then applies `teacherAuth` globally to CMS/domain routes.
3. Route modules call controller static methods directly.
4. Controllers call Sequelize models directly; there is no service or repository layer.
5. `models/index.js` selects the Sequelize config by `NODE_ENV`, creates a Sequelize instance, dynamically loads every model, and attaches associations. It does not explicitly `authenticate()` or `sync()`.
6. Controllers forward most errors to one global error handler; chat controllers handle errors locally.

## Layer map

| Layer | Location | Responsibility | Assessment |
|---|---|---|---|
| Entry/server | `app.js` | Express, HTTP listener, global middleware, Socket.IO | Combined app and process startup makes testing/deployment awkward |
| Routing | `routes/*.js` | Prefixes, methods, authentication middleware | Clear route modules; authorization not applied |
| Controllers | `controllers/*.js` | Validation, ORM queries, business rules, audit history, payment/email | Controller-heavy and tightly coupled |
| Services | None | — | Payment/email/business logic has no isolation |
| Repositories | None | — | Controllers depend directly on Sequelize |
| Models | `models/*.js` | Attributes, validation, hooks, associations | Reasonably small but drifted from migrations |
| DB bootstrap | `models/index.js`, `config/config.json` | Environment selection and Sequelize construction | Standard Sequelize CLI pattern; no health/readiness check |
| Auth | `middlewares/authentication.js`, `helpers/index.js` | JWT verify and DB identity lookup | Authentication only; weak token configuration |
| Authorization | `middlewares/authorization.js` | Commented movie-template code only | Not implemented |
| Errors | `middlewares/errorHandler.js` | Maps a few error names to JSON `{msg}` | Centralized but incomplete and logs raw errors |
| Realtime | `middlewares/socketio.js` | Join room, persist message, emit room history | Separate module, but unauthenticated/client-controlled |
| Payment | `controllers/transactionController.js` | Instantiate Snap, create external transaction, send email | Per-request and tightly coupled to HTTP side effects |

Overall architecture: **partially separated, controller-heavy, tightly coupled, and inconsistent, but small enough to revive selectively**. It is not inherently difficult because files are compact; the difficulty comes from identity/authorization and schema behavior crossing most features.

# Dependency and Tooling Risks

## Direct dependencies

| Dependency | Locked version | Use/risk |
|---|---:|---|
| express | 4.18.2 | HTTP framework; conventional and central |
| sequelize / sequelize-cli | 6.29.0 / 6.6.0 | ORM/migrations; model/migration drift is the bigger risk than framework shape |
| pg | 8.9.0 | Sequelize PostgreSQL driver |
| postgres | 3.3.3 | No source import found; apparently unused duplicate PostgreSQL client |
| jsonwebtoken | 9.0.0 | JWT; unsafe application configuration despite modern-enough library shape |
| bcryptjs | 2.4.3 | Password hashing; synchronous cost-10 operations |
| socket.io | 4.6.1 | Realtime chat |
| midtrans-client | 1.3.1 | Depends on axios 0.26; external sandbox integration |
| nodemailer | 6.9.1 | Email after transaction token generation |
| cors / dotenv | 2.8.5 / 16.0.3 | Global CORS and local env loading |
| slug | 8.2.2 | Used only by lesson controller; generated value is not modeled/persisted |
| jest / supertest | 29.5.0 / 6.3.3 | Incorrectly listed as production dependencies rather than dev dependencies |

No direct package in the lockfile carries a visible `deprecated` marker. That does not establish current support or security; the lockfile is from the last 2023 commit and all external integrations require runtime/version verification before revival.

## Scripts

| Script | Behavior | Risk/status |
|---|---|---|
| `test` | Jest in-band, force-exit, coverage | Present; forbidden in this audit; DB-dependent |
| `reset-db` | Drop, create, migrate, seed all | Destructive; must never target a non-demo DB |
| `reset-server-test` | Drop/create/migrate/seed test DB | Destructive; explicit test DB but still requires configuration review |
| `start` | Missing | P0 standard startup blocker |
| `dev` | Missing | Tooling gap |
| lint/format/typecheck | Missing | No static quality gate |
| migrate/seed-only | Missing from npm scripts | CLI can exist, but no safe documented workflow |

## Compatibility/revival risks

- No Node version pin or `engines` field. The 2023 lock and Jest engines suggest Node 16/18 as the safest first verification targets; modern Node compatibility is **runtime verification required**.
- `package.json.main` targets nonexistent `index.js` while only `app.js` looks executable.
- `middlewares/socketio.js` imports `axios` without declaring it directly. It is currently present transitively through `midtrans-client`, so fresh npm layout may make it resolve, but relying on a transitive package is fragile.
- `app.js` listens during import. Supertest imports the app, so test isolation/open-handle behavior is suspect.
- Jest and Supertest increase production install size because they are regular dependencies.
- `postgres` is unused; having two PostgreSQL clients creates maintenance ambiguity.
- No CI, Docker, deployment manifest, health check, structured logging, or documented boot command was found.
- README is only a rough schema note and a reminder to edit local PostgreSQL config; it does not document setup, routes, environment, demo accounts, or deployment.

# Environment Variables

## Referenced variables

| Variable | Classification | Used at | Purpose | Absence likely blocks runtime? |
|---|---|---|---|---|
| `NODE_ENV` | server startup / database | `app.js:1`, `models/index.js:8` | Controls dotenv loading and selects development/test/production DB profile | No; defaults to development, but a wrong value can select missing config and block initialization |
| `PORT` | server startup / optional | `app.js:10` | HTTP/Socket.IO listener port | No; defaults to 3000 |
| `DATABASE_URL` | database / server startup in production | `.env.example.txt`, `config/config.json` via `models/index.js:14` | Production PostgreSQL connection string | Yes when `NODE_ENV=production`; no in development/test, which use hardcoded config values |
| `JWT_SECRET` | authentication, currently unused | `.env.example.txt`; only commented references in `app.js:5` and `helpers/index.js:3` | Intended JWT signing secret | No in current code because JWT uses a hardcoded value; this is a security defect, not a benefit |

No environment variables exist for Midtrans or email. Both integrations use committed values instead.

## Hardcoded configuration and sensitive material

| Location | Verified fact | Risk/action |
|---|---|---|
| `helpers/index.js:10-11` | JWT signing value is hardcoded (`<redacted>`) | Rotate; read required secret from environment; invalidate all old tokens |
| `controllers/transactionController.js:20-23` | Midtrans Snap sandbox mode and server key are hardcoded (`<redacted>`) | Revoke/rotate; never commit; do not use current payment path in demo |
| `helpers/nodemailer.js:3-9` | Gmail identity and password are hardcoded (`<redacted>`) | Revoke/rotate immediately; remove email side effect or configure a safe demo provider |
| `config/config.json` | Development/test database usernames/passwords are committed (`<redacted>`); hosts are `localhost` and `127.0.0.1` | Replace with environment configuration; ensure values are not reused anywhere |
| `data-seeding/user.json`, `data-seeding/teacher.json`, tests | Demo login identifiers/passwords are committed in plaintext (`<redacted>`) | Treat as public demo credentials only; use new synthetic values and never reuse real credentials |
| tests | A hardcoded invalid JWT sample is present (`<redacted>`) | Low risk if truly dummy, but do not publish token-like values unnecessarily |

Other hardcoded network configuration:

- HTTP CORS is unrestricted via `app.use(cors())` in `app.js:16`.
- Socket.IO CORS origin is `*` in `middlewares/socketio.js:7-11`.
- Default port is 3000.
- Seed/tests reference third-party image hosts, including some plain HTTP URLs. Availability, licensing, mixed-content behavior, and privacy are runtime/browser review items.
- No production API domain, fixed public IP, callback URL, or webhook URL was found.

# Database and Domain Model

## Entity map

| Entity | Important fields | Relationships / foreign keys | System role | Static concerns |
|---|---|---|---|---|
| Teacher | NIP, name, password | `Teacher hasOne Class`; `Class.TeacherId` FK | CMS identity and homeroom teacher | Migration has `imgUrl`, model omits it; login assumes exactly one class; GET exposes password hash |
| Class | name, TeacherId, SPP | belongs Teacher; has many Student/Schedule | Class grouping and monthly fee | `TeacherId` required by model but nullable in migration; one-to-one teacher assumption |
| Student | NIM, name, age, gender, birthDate, feedback, ClassId, imgUrl | belongs Class; has many Attendance/Score/Transaction; has one User | Core learner profile | `age` is STRING in model vs INTEGER migration; migration does not enforce model null/unique rules |
| User (parent) | NIM, password, email, StudentId | belongs Student; Student has one User | Parent/student-client login | No separate Parent entity/role; User NIM not unique; auth finds Student by NIM rather than `StudentId` association |
| Lesson | name, imgUrl, KKM, desc | has many Score/Schedule | Subject catalog | Controller generates `slug`, but no model/migration field |
| Assignment | name, type, desc | has many Score | Task/exam metadata | All fields nullable in model/migration; read-only route only |
| Score | AssignmentId, StudentId, LessonId, value, category, desc, status | belongs Student/Lesson/Assignment; FKs in migration | Per-assignment grades and pass/status | Edit targets every score for student+lesson, ignoring AssignmentId; category hook only runs on create |
| Attendance | StudentId, status, timestamps | belongs Student; FK in migration | Daily attendance represented by `createdAt` | StudentId STRING model vs INTEGER migration; no explicit attendance date; unsafe last-record logic |
| Schedule | ClassId, LessonId, day | belongs Class/Lesson; both migration FKs | Class timetable | Model does not explicitly declare LessonId (association injects it); teacher read controller broken |
| Activity | name, date, desc in migration | no associations | School events | Model omits `desc`, so seeded description is not represented by Sequelize model |
| Transaction | status, dueDate, StudentId | belongs Student; FK in migration | School-fee status | No amount/order/provider ID; nullable fields; no webhook/audit trail |
| Chat | fromUserId, toUserId, roomId, message | no database FKs or Sequelize associations | Parent-teacher messages | IDs span separate User/Teacher namespaces with no type; integrity/ownership unenforced |
| History | description, createdBy | no FKs | Human-readable CMS audit log | Actor stored as mutable name; non-transactional; several controllers log `undefined` after destroy/update |
| Uniform | name, `addtional1`, additional2/3 | none | Unused concept | Model and JSON exist, but no migration, route, controller, or seeder; typo differs from JSON key |

There is no dedicated Parent model, role table, payment order model, chat room model, or message-participant relation. “Parent” is inferred to be `User` linked one-to-one to `Student`.

## Migration/seed completeness and drift

Verified facts:

- Migrations create 13 tables: Teachers, Activities, Chats, Classes, Students, Attendances, Lessons, Users, Transactions, Assignments, Scores, Schedules, Histories.
- Uniform has no migration. Every other actively routed domain has a create migration.
- Migrations have standard destructive `down` methods, and `reset-db` begins with a full database drop.
- Seeders cover Teachers, Activities, Classes, Students, Attendances, Lessons, Schedules, Users, Assignments, Scores, Chats, and Transactions. No History or Uniform seeder exists.
- Seed JSON provides 2 teachers, 2 classes, 24 students, 10 users, 364 attendances, 5 lessons, 20 schedules, 55 assignments, 44 scores, 10 activities, 10 transactions, 3 chats, and 3 unused uniforms.
- Only 10 of 24 students have seeded user/payment records, so not every student can demonstrate parent login/payment.
- The attendance JSON contains historical `createdAt` values, but `seeders/20230303142248-seed-attendances.js:6-9` overwrites every `createdAt` with the current time. Historical attendance is therefore not reconstructed as authored.
- Seeder passwords start as committed plaintext and are bcrypt-hashed before insertion.
- Chat seeds use numeric room values while the REST writer uses a string prefixed with `room ` and multiplication; Socket.IO accepts an arbitrary room string. Seed/live formats are inconsistent.

Inference:

- The core demo schema can probably be reconstructed from migrations and seeders after repair because dependencies and seed order are mostly represented. **Runtime verification required.**
- Schema drift is visible and should be resolved through reviewed corrective migrations/model changes, not Sequelize `sync`. **Do not run existing reset scripts against any valuable database.**
- The migrations are “broadly complete” for current routes, not trustworthy proof of a successful fresh build. Constraint ordering, null behavior, seed FK consistency, and PostgreSQL compatibility require runtime verification.

# API Route Inventory

The route files contain 54 active HTTP route declarations. The table below maps all of them. “Authz: none” means identity authentication exists where stated, but no ownership/class/admin authorization check is enforced. All operational conclusions remain subject to runtime verification.

## Authentication, parent, public, and chat routes

| Method/path | Handler | Auth / authz | Expected input | Likely response and models | Static status |
|---|---|---|---|---|---|
| `POST /users/login` | `UserController.login` | None / none | Body: `NIM`, `password` | 200 `{access_token,id,teacherId}`; User→Student→Class | Implemented; runtime verification required |
| `GET /users/userChild` | `UserController.userChild` | userAuth / own NIM implicit | Header `access_token` | Student with Class/Teacher, Attendances, Scores/Lesson | Implemented; duplicates `/public/detail` |
| `POST /users/generate-midtrans/:id` | `TransactionController.midtransToken` | userAuth / none | Path student ID | 201 raw Midtrans token/redirect object; Student, Class, User, Transaction read | Present but incomplete and insecure; external runtime verification required |
| `GET /public/classmate` | `publicController.allStudent` | userAuth / class derived from token | None | Array of Students with Scores/Lesson for caller class | Implemented; runtime verification required |
| `GET /public/detail` | `publicController.studentById` | userAuth / own NIM implicit | None | Student with Class/Teacher, Attendances, Scores/Assignment/Lesson | Implemented; runtime verification required |
| `GET /public/lesson` | `publicController.studentlessondetail` | userAuth / class derived | Query `day` required | Schedule array with Lesson | Implemented; locale/value matching runtime required |
| `GET /public/schedule` | `publicController.schedules` | userAuth / class derived | None | Schedule array with Lesson | Implemented; runtime verification required |
| `GET /public/activity` | `publicController.allActivities` | userAuth / none | None | Activity array | Implemented, but `desc` omitted by model |
| `GET /public/transaction` | `publicController.transactionStatus` | userAuth / intended own student | None | One Transaction or null | Present but likely wrong identity (`User.id` used as StudentId) |
| `GET /public/statistic` | `publicController.statistic` | userAuth / intended own student | None | Array of `{name,avg}` from raw SQL | Present but likely wrong identity (`User.id` used as StudentId) |
| `PATCH /public/transaction` | `publicController.successPayment` | userAuth / own NIM lookup | None documented; body ignored | Sequelize update count array | Implemented but security-invalid client-controlled payment completion |
| `POST /chatParent` | `chatController.postMessage` | userAuth / none | Body `from`,`to`,`message` | Created Chat; room derived as `room ` + product | Implemented but insecure/collision-prone |
| `GET /chatParent/:toId` | `chatController.getAllUserRelatedToSender` | userAuth / none | Path target ID | Grouped Chat senders plus `parentName` arrays | Present; semantics likely teacher-oriented/incompatible for parent use |
| `GET /chatParent/:from/:to` | `chatController.getMessageHistory` | userAuth / none | Two participant IDs | Raw Chat array in both directions | Present but incomplete; IDOR |
| `POST /chatTeacher` | `chatController.postMessage` | teacherAuth / none | Body `from`,`to`,`message` | Created Chat | Implemented but insecure/collision-prone |
| `GET /chatTeacher/:toId` | `chatController.getAllUserRelatedToSender` | teacherAuth / none | Target teacher ID | Grouped senders with parent/student names | Present and plausibly intended for inbox; no ownership check |
| `GET /chatTeacher/:from/:to` | `chatController.getMessageHistory` | teacherAuth / none | Two participant IDs | Raw Chat history | Present but incomplete; IDOR |

## Teacher/CMS routes

All routes after the chat mounts in `routes/index.js:28-39` pass through `teacherAuth`. Student routes redundantly apply it a second time.

| Method/path | Handler | Auth / authz | Params/query/body | Likely response and models | Static status |
|---|---|---|---|---|---|
| `POST /teachers/login` | `TeacherController.login` | None / none | Body `NIP`,`password` | 200 `{id,access_token,ClassId}`; Teacher, Class | Present but broken for unknown teacher or teacher without class |
| `GET /teachers` | `TeacherController.allTeacher` | teacherAuth / none | None | Raw Teacher array | Implemented but leaks password hashes |
| `POST /teachers/register` | `TeacherController.register` | teacherAuth / no admin role | Body `NIP`,`password`,`name` | 201 `{msg,history}`; Teacher, Class, History | Present but incomplete; requires caller class and lets any teacher register teachers |
| `GET /students` | `StudentController.allStudents` | teacherAuth twice / none | Query `pageIndex`,`ClassId`,`name`; fixed page size 7 | `{count,rows,page,totalPages}`; Student, Attendance, Class/Teacher, Score/Lesson | Implemented; unscoped to caller class |
| `GET /students/:id` | `StudentController.studentById` | teacherAuth twice / none | Student ID | Student with Attendance, Scores/Assignment/Lesson | Partially implemented; unscoped and nullable Assignment can crash score calculation |
| `POST /students` | `StudentController.addStudent` | teacherAuth twice / caller class used for new row | Body `NIM,name,age,gender,birthDate,feedback,imgUrl` | 201 `{data,history}`; Student, Class/Teacher, History | Implemented; caller without class fails |
| `PUT /students/:id` | `StudentController.editStudent` | teacherAuth twice / none | ID; same profile body | 200 `{status,history}` | Implemented but can move/edit any student; ignores ownership |
| `DELETE /students/:id` | `StudentController.deleteStudent` | teacherAuth twice / none | Student ID | 200 `{message,history}` | Implemented; history description uses destroyed count and can contain undefined |
| `GET /assignments` | `AssignmentController.allAssignment` | teacherAuth / none | None | Assignment array | Implemented |
| `GET /lessons` | `LessonController.allLessons` | teacherAuth / none | None | Lesson array | Implemented |
| `GET /lessons/:id` | `LessonController.lessonById` | teacherAuth / none | Lesson ID | Lesson | Implemented |
| `POST /lessons` | `LessonController.addLesson` | teacherAuth / none | Body `name,imgUrl,KKM,desc` | 201 `{data,history}` | Implemented; generated slug is silently not modeled/persisted |
| `PUT /lessons/:id` | `LessonController.editLesson` | teacherAuth / none | ID; body only consumes `name` | 200 `{status,history}` | Partially implemented; ignores imgUrl/KKM/desc |
| `DELETE /lessons/:id` | `LessonController.deleteLesson` | teacherAuth / none | Lesson ID | 200 `{message,history}` | Implemented; FK cascade implications runtime required |
| `POST /scores` | `ScoreController.addScore` | teacherAuth / none | Body `StudentId,LessonId,value,AssignmentId,desc` | 201 `{data,history}` | Implemented; no assignment existence/class ownership check |
| `PUT /scores` | `ScoreController.editScore` | teacherAuth / none | Body `StudentId,LessonId,value` | 200 `{msg,history}` | Partially implemented; updates all matching assignments; stale category/status |
| `GET /activities` | `ActivityController.allActivities` | teacherAuth / none | None | Activity array | Implemented; model omits description |
| `GET /activities/:id` | `ActivityController.activityById` | teacherAuth / none | Activity ID | Activity | Implemented; model omits description |
| `POST /activities` | `ActivityController.addActivity` | teacherAuth / none | Body `name,date` | 201 `{data,history}` | Implemented; cannot accept migration `desc` field |
| `PUT /activities/:id` | `ActivityController.editActivity` | teacherAuth / none | ID; body `name,date` | `{data:[count],history}` | Partially implemented; audit uses update count as object |
| `DELETE /activities/:id` | `ActivityController.deleteActivity` | teacherAuth / none | Activity ID | 200 `{message,history}` | Partially implemented; audit uses destroy count as object |
| `GET /attendances` | `AttendanceController.allAttendance` | teacherAuth / none | Optional query `StudentId` | Attendance array | Implemented; cross-class access |
| `POST /attendances` | `AttendanceController.addAttendance` | teacherAuth / none | Body `StudentId,status` | Created Attendance | Partially implemented; date inferred from timestamp, race/month bugs, non-transactional history |
| `PUT /attendances` | `AttendanceController.editAttendance` | teacherAuth / none | Body `StudentId,status` | Pre-update last Attendance object | Partially implemented; undefined when none, unordered “last”, stale response |
| `GET /schedules` | `ScheduleController.schedules` | teacherAuth / intended caller class | None | Schedule array with Lesson | Broken by obvious code issue: `Lesson` undefined; ClassId/teacher-ID confusion |
| `GET /schedules/:id` | `ScheduleController.scheduleById` | teacherAuth / none | Schedule ID | Schedule with Lesson | Broken by obvious code issue: `Lesson` undefined; unscoped |
| `POST /schedules` | `ScheduleController.addSchedule` | teacherAuth / none | Body `ClassId,day,LessonId` | 201 `{data,history}` | Implemented but arbitrary class assignment |
| `PUT /schedules/:id` | `ScheduleController.editSchedule` | teacherAuth / none | ID; body `ClassId,day,LessonId` | 200 `{status,history}` | Implemented but arbitrary class assignment |
| `DELETE /schedules/:id` | `ScheduleController.deleteSchedule` | teacherAuth / none | Schedule ID | 200 `{message,history}` | Implemented but unscoped |
| `GET /histories` | `HistoryController.allHistories` | teacherAuth / none | Query `pageIndex`,`createdBy`; fixed size 7 | `{count,rows,page,totalPages}` | Implemented; unscoped and actor is free text |
| `GET /classes` | `classController.fetchAllClass` | teacherAuth / none | None | Class array | Implemented |
| `GET /classes/:classId` | `classController.fetchClassById` | teacherAuth / none | Class ID | Class | Implemented |
| `POST /classes` | `classController.addClass` | teacherAuth / none | Body `name,TeacherId,SPP` | 201 `{data,history}` | Implemented; any teacher can create/assign any class |
| `PUT /classes/:id` | `classController.editClass` | teacherAuth / none | ID; body `name,TeacherId,SPP` | `{data:[count],history}` | Partially implemented; no ownership, weak response |
| `DELETE /classes/:id` | `classController.deleteClass` | teacherAuth / none | Class ID | 200 `{message,history}` | Implemented; cascade can delete students/data; no authorization |
| `GET /transactions` | `TransactionController.allTransactions` | teacherAuth / none | None | 201 `{msg:"payment success"}`; query result discarded | Present but incompatible/incomplete |
| `GET /` | inline handler | teacherAuth / none | None | Text server-status banner | Implemented but unexpectedly protected and not a health endpoint |

## Expected-route presence count

- Parent/student expected paths: **10 / 10 present**.
- Teacher/admin expected paths: **30 / 30 present**.
- Total expected paths: **40 / 40 present**.
- Presence is syntactic only. Two expected routes are obviously broken on invocation (`GET /schedules`, `GET /schedules/:id`), and many others are incomplete, insecure, or identity-incompatible.

# Frontend Compatibility Matrix

The “expected request” column is based on server code and the supplied frontend expectations. Exact client payload/response consumption was not available in this repository, so even “likely compatible” requires runtime verification.

## Parent/student client

| Feature / expected endpoint | Backend handler | Expected request → likely response | Compatibility status | Mismatch / recommended correction | Effort |
|---|---|---|---|---|---|
| Login — `POST /users/login` | `UserController.login` | `{NIM,password}` → `{access_token,id,teacherId}` | Present and likely compatible; runtime verify | Token has no expiry; `id` is User ID, not Student ID; explicitly return both IDs and role | 2–4h |
| Daily lessons — `GET /public/lesson?day=:day` | `studentlessondetail` | token + day → Schedule[] with `Lesson` | Present and likely compatible | Seed days use English while tests use Indonesian; normalize allowed day values | 1–3h |
| Classmates — `GET /public/classmate` | `allStudent` | token → Student[] with `Scores[].Lesson` | Present and likely compatible | Exposes more student/score data than necessary; define safe projection | 2–4h |
| Profile/detail — `GET /public/detail` | `studentById` | token → `studentDetail`-like Student with `Class.Teacher`, `Attendances`, `Scores[].Lesson/Assignment` | Present and likely compatible | Response is a raw model, not wrapped as `studentDetail`; null Assignment crash risk is in CMS detail, not this handler | 2–4h |
| Schedule — `GET /public/schedule` | `schedules` | token → Schedule[]/`Lesson` | Present and likely compatible | Add ordering and stable response DTO | 1–2h |
| Activities — `GET /public/activity` | `allActivities` | token → Activity[] | Present but likely incomplete | `desc` exists in migration/seed but not model, so descriptions likely disappear; align schema/model | 1–2h |
| Payment status — `GET /public/transaction` | `transactionStatus` | token → Transaction/null | Present but likely incompatible | Filters StudentId using User ID; derive StudentId from association | 1–2h |
| Statistics — `GET /public/statistic` | `statistic` | token → subject averages | Present but likely incompatible | Raw SQL filters StudentId using User ID; use associated StudentId and parameterized Sequelize query | 2–4h |
| Generate payment — `POST /users/generate-midtrans/:studentId` | `midtransToken` | token + student ID → Midtrans transaction object | Present but incomplete/unsafe | IDOR, null transaction crash, committed credential, no persisted order/webhook; replace with stub for demo | 3–6h stub; 16–30h safe sandbox |
| Chat history — `GET /chatParent/:userId/:teacherId` | `getMessageHistory` | token + IDs → Chat[] | Present but incomplete | No participant authorization; ambiguous ID namespaces/room scheme; hide or redesign | 12–24h |

## Teacher/admin CMS

| Feature / expected endpoint | Backend handler | Expected request → likely response | Compatibility status | Mismatch / recommended correction | Effort |
|---|---|---|---|---|---|
| Login — `POST /teachers/login` | `TeacherController.login` | `{NIP,password}` → `{id,access_token,ClassId}` | Present but incomplete | Dereferences missing teacher before null check and assumes Class exists; null-safe login and explicit class list/ID | 2–4h |
| Student list — `GET /students` | `allStudents` | token + filters → `{count,rows,page,totalPages}` | Present and likely compatible | Not restricted to teacher class; clarify pageIndex base | 2–4h |
| Student detail — `GET /students/:id` | `studentById` | ID → Student with `Attendances`,`Scores[].Lesson/Assignment` | Present but incomplete | No class ownership; code dereferences nullable Assignment | 2–4h |
| Create student — `POST /students` | `addStudent` | profile body → `{data,history}` | Present and likely compatible | Class forced from caller, but teacher without class crashes; validate DTO | 2–4h |
| Update student — `PUT /students/:id` | `editStudent` | ID + profile → `{status,history}` | Present and likely compatible shape uncertain | No class ownership; response omits updated student | 2–4h |
| Delete student — `DELETE /students/:id` | `deleteStudent` | ID → message/history | Present and likely compatible | No ownership; cascades; broken history name | 2–4h |
| Teacher list — `GET /teachers` | `allTeacher` | token → Teacher[] | Present but unsafe | Returns password hashes; project safe fields only | 1h |
| Teacher registration — `POST /teachers/register` | `register` | `{NIP,password,name}` → message/history | Present but incomplete | No admin role; assumes caller owns class; hide from demo or add admin-only policy | 1h hide; 6–10h secure |
| Class list — `GET /classes` | `fetchAllClass` | token → Class[] | Present and likely compatible | Unscoped; acceptable only for demo admin role | 1–2h |
| Class detail — `GET /classes/:id` | `fetchClassById` | ID → Class | Present and likely compatible | Param is named `classId` internally; no ownership | 1–2h |
| Create class — `POST /classes` | `addClass` | `{name,TeacherId,SPP}` → `{data,history}` | Present and likely compatible | Any teacher acts as admin; hide unless admin model added | 1h hide; 4–8h secure |
| Update class — `PUT /classes/:id` | `editClass` | body → update count/history | Present but likely response-incompatible | Return updated Class; enforce admin/ownership | 2–4h |
| Delete class — `DELETE /classes/:id` | `deleteClass` | ID → message/history | Present but dangerous | Cascades student data; hide from live demo | 1h hide |
| Lesson list — `GET /lessons` | `allLessons` | token → Lesson[] | Present and likely compatible | Stable projection/order recommended | 1h |
| Lesson detail — `GET /lessons/:id` | `lessonById` | ID → Lesson | Present and likely compatible | None obvious beyond runtime | 1h |
| Create lesson — `POST /lessons` | `addLesson` | `{name,imgUrl,KKM,desc}` → `{data,history}` | Present and likely compatible | Slug is not persisted; either remove it or migrate it | 1–2h |
| Update lesson — `PUT /lessons/:id` | `editLesson` | expected full edit → status/history | Present but incomplete | Only reads `name`; preserve/update other fields and return entity | 2–3h |
| Delete lesson — `DELETE /lessons/:id` | `deleteLesson` | ID → message/history | Present and likely compatible | Cascade behavior and authorization need review | 1–2h |
| Score update — `PUT /scores` | `editScore` | `{StudentId,LessonId,value}` → message/history | Present but incomplete | Updates all assignments for subject; category/status not recalculated; identify Score or Assignment | 3–6h |
| Attendance create — `POST /attendances` | `addAttendance` | `{StudentId,status}` → Attendance | Present but incomplete | No explicit date/class auth; day-of-month check and race; add date + unique constraint | 4–8h |
| Attendance update — `PUT /attendances` | `editAttendance` | `{StudentId,status}` → Attendance | Present but incomplete | Updates unordered last row and returns stale object; accept attendance ID/date | 3–5h |
| Schedule list — `GET /schedules` | `schedules` | token → Schedule[] with Lesson | Broken by obvious code issue | Import Lesson and resolve TeacherId→Class.id correctly | 1–3h |
| Schedule detail — `GET /schedules/:id` | `scheduleById` | ID → Schedule/Lesson | Broken by obvious code issue | Import Lesson and enforce class scope | 1–2h |
| Schedule create — `POST /schedules` | `addSchedule` | `{ClassId,day,LessonId}` → data/history | Present and likely compatible | Validate class/lesson and caller ownership | 2–3h |
| Schedule update — `PUT /schedules/:id` | `editSchedule` | same body → status/history | Present and likely compatible shape uncertain | Enforce scope and return updated entity | 2–3h |
| Schedule delete — `DELETE /schedules/:id` | `deleteSchedule` | ID → message/history | Present and likely compatible | Enforce class scope | 1–2h |
| Audit history — `GET /histories` | `allHistories` | filters → paginated result | Present and likely compatible | Unscoped; actor is string; several producers log incorrect descriptions | 2–4h |
| Transactions — `GET /transactions` | `allTransactions` | token → expected transaction list | Present but incompatible | It discards query result and returns 201 success message; return safe list or stub status table | 1–3h |
| Chat inbox — `GET /chatTeacher/:teacherId` | `getAllUserRelatedToSender` | teacher ID → grouped senders | Present but incomplete | Caller can request another teacher; parentName is nested array; ambiguous IDs | 4–8h |
| Chat history — `GET /chatTeacher/:teacherId/:parentUserId` | `getMessageHistory` | IDs → Chat[] | Present but incomplete | No participant authorization or typed identity | 8–16h as part of chat redesign |

Compatibility summary: endpoint naming coverage is strong, and raw Sequelize association names (`Class`, `Teacher`, `Scores`, `Attendances`, `Lesson`, `Assignment`) broadly align with the supplied frontend field expectations. The dominant mismatches are identity semantics (`id` vs StudentId), inconsistent response envelopes, broken schedule reads, omitted model fields, overly broad mutations, and unsafe chat/payment flows. Exact `studentDetail`, room-ID, transaction-status, and update-response consumption is **runtime verification required**.

# Authentication and Authorization

## Verified flows

- Parent/student login accepts `NIM` and `password`, finds `User` plus Student/Class, checks bcrypt, and returns `{access_token,id,teacherId}` (`controllers/userController.js:5-26`).
- Teacher login accepts `NIP` and `password`, checks bcrypt, and returns `{id,access_token,ClassId}` (`controllers/teacherController.js:5-22`).
- Passwords are bcryptjs hashes with generated salt cost 10 through model `beforeCreate` hooks and seeders (`helpers/index.js:7-8`, `models/user.js:39-41`, `models/teacher.js:47-49`).
- JWTs are HMAC tokens generated by `jsonwebtoken.sign`. Their payload is only the raw NIM or NIP string. There is no expiry, issuer, audience, role, token ID, or key rotation (`helpers/index.js:10-11`).
- Tokens are read from the nonstandard `access_token` request header. Each protected request decodes the token and looks up a User or Teacher in the database (`middlewares/authentication.js`).

## Static defects and risks

- The signing secret is hardcoded and the declared `JWT_SECRET` variable is unused.
- Parent and teacher tokens have indistinguishable structure and share a secret; endpoint middleware decides the identity table.
- `TeacherController.login` queries `Class` using `data.id` before verifying that `data` exists. Invalid credentials can become a 500 instead of the intended login error. A teacher without a Class also causes `kelas.id` failure.
- `userAuth` does not check whether the matching Student exists before reading `student.ClassId`.
- There are no roles. Any valid teacher can register teachers and mutate global classes, lessons, activities, students, scores, attendance, schedules, and transactions.
- There are no resource ownership checks. A teacher can address another class/student; a parent can request payment for another student; chat participants are path/body-controlled.
- `GET /teachers` serializes password hashes because it uses unfiltered `Teacher.findAll()`.
- No login rate limiting, account lockout, password-reset flow, refresh/revocation mechanism, or security headers are present.

Authorization is therefore **not enforced server-side beyond identity type**. Role authorization and class/student ownership authorization are missing.

# Socket.IO Chat

## Verified implementation

- `app.js` creates an HTTP server and passes it to `connIOServer`.
- Socket.IO allows origin `*` and accepts every connection without token verification.
- `join:room` joins any client-supplied room.
- `chat:msg` trusts `data.from`, `data.to`, `data.room`, and `data.msg.message`, persists a Chat, reloads every message in that room, and emits `resp:msg` with the full history.
- REST POST routes also persist messages, but compute room ID as `'room ' + from * to`.
- REST history loads messages bidirectionally by `fromUserId`/`toUserId` and ignores room ID.

## Risks and mismatches

- No Socket.IO authentication or room membership authorization exists.
- Any socket can impersonate participant IDs, join arbitrary rooms, and read broadcasts sent there.
- Multiplication-based room IDs collide: different participant pairs can have the same product.
- REST, seed, and Socket.IO room formats disagree.
- User IDs and Teacher IDs occupy separate tables but share untyped integer columns, so identity is ambiguous.
- If a client emits through Socket.IO and also POSTs the same message, duplicate persistence is possible; no idempotency key exists.
- Concurrent writes are not ordered by a server sequence beyond database timestamps/IDs.
- `resp:msg` returns full room history after every message, increasing payloads over time.
- Errors are only logged and not acknowledged to the sender.
- `getIO()` references `io` outside its local function scope and would throw if called.

**Recommendation: better mocked for portfolio.** Hide chat for the minimum demo. If retained later, use authenticated Socket.IO middleware, a ChatRoom/participants model, server-derived room IDs, authorization on REST and socket events, message acknowledgements, and pagination. Revival estimate: 12–24 hours plus frontend runtime verification.

# Midtrans Integration

## Verified implementation

- SDK: `midtrans-client` 1.3.1; Snap client instantiated per request.
- Mode: sandbox (`isProduction: false`).
- Server credential: hardcoded (`<redacted>`). No client-key variable or client key was found server-side.
- Endpoint: `POST /users/generate-midtrans/:id`, protected only by parent authentication.
- It loads Student with Class/User, checks the most recent Transaction, creates an order ID from current milliseconds, uses Class.SPP as gross amount, calls `snap.createTransaction`, returns the SDK object, and triggers email.

## Missing/insecure behavior

- The caller-supplied student ID is not checked against the authenticated User.
- A missing Student or Transaction causes null dereference rather than a clear error.
- No Midtrans order ID, token, amount, status history, or provider response is persisted.
- No callback/webhook route, signature verification, reconciliation, expiry, retry, refund, or idempotency exists.
- `PATCH /public/transaction` lets an authenticated client mark its transaction paid without proof from Midtrans.
- Email is sent after the response without awaiting/handling the promise, using committed Gmail credentials. Its callback references an undefined `user` variable.
- `GET /transactions` queries records but discards them and returns HTTP 201 with a generic success message.

**Recommendation: replace with a safe payment stub.** Display synthetic `paid`, `due`, or `overdue` status from seeded data and disable external checkout. A real sandbox revival is possible only after credential rotation, ownership checks, persisted orders, webhook verification, and explicit test-mode labeling; estimate 16–30 hours.

# Implemented Feature Matrix

| Feature | Static classification | Evidence/qualification |
|---|---|---|
| Parent/student login | Backend code exists but runtime verification required | JWT/bcrypt flow exists; unsafe secret and identity ambiguity |
| Teacher login | Partially implemented | Null teacher/class dereference |
| Teacher registration | Partially implemented | Authenticated but no admin role; caller class assumption |
| Student CRUD | Backend code exists but runtime verification required | All routes exist; ownership and response defects |
| Class CRUD | Backend code exists but runtime verification required | All routes exist; destructive/unscoped mutations |
| Lesson/subject CRUD | Partially implemented | Update only handles name; slug not persisted |
| Attendance entry | Partially implemented | Timestamp/day logic and race/ownership problems |
| Attendance history | Implemented | Returned through student/public detail and GET attendance; no explicit attendance date |
| Score entry | Partially implemented | POST exists; expected frontend emphasizes PUT; ownership absent |
| Teacher feedback | Implemented | `Student.feedback` is created/updated with student profile |
| Schedules | Partially implemented | Parent reads plausible; teacher GET routes obviously broken |
| School activities | Partially implemented | CRUD exists; model omits seeded/migrated description |
| Statistics/dashboard aggregation | Partially implemented | Raw average query uses likely wrong ID |
| Transaction/payment | Partially implemented | Status records and Snap call exist; no trustworthy payment lifecycle |
| Parent-teacher chat | Partially implemented | Persistence and events exist; authorization/room model unsafe |
| Role authorization | Missing | No role field/check |
| Class/student ownership authorization | Missing | Authorization middleware is only comments |

# Codebase Health

## Strengths

- Small, navigable route/controller/model structure.
- Consistent async controller shape and a shared error handler for most HTTP routes.
- Sequelize associations represent a nontrivial school domain.
- Migration and synthetic seed coverage is broad enough to support a demo after repair.
- Tests document many intended endpoints and failure cases.
- Password hashing is present; ORM queries dominate rather than handwritten SQL.

## Important health issues

| Location | Evidence | Impact |
|---|---|---|
| `app.js` | Starts listener during module import; error middleware registered after `listen` call | App/process concerns coupled; tests/deployment awkward |
| `package.json` | Missing start script; nonexistent main file | Standard startup fails |
| `controllers/*` | ORM, validation, history, payment, and email mixed in controllers | High coupling and duplicated actor lookup |
| `controllers/studentController.js:123,135,150` and many peers | Repeated Class→Teacher query for audit actor | Duplication; null class crashes many writes |
| `controllers/*` create/update/delete | Data change and History insert are separate, no DB transaction | Partial writes or missing audit history |
| `controllers/attendance.js:33-43` | Day-of-month comparison, no order, race window | Duplicate/incorrect attendance |
| `controllers/scoreController.js:38` | Update by StudentId+LessonId | Multiple assignment scores overwritten |
| `controllers/publicController.js:128-134` | Raw interpolated SQL | ORM bypass; current value is server-derived but parameterization is still required |
| `middlewares/errorHandler.js` | Only selected error names mapped; raw error logged | Unstable 500s and potential sensitive logs |
| `middlewares/socketio.js`, `controllers/chatController.js` | Local error responses/logs differ from global API errors | Inconsistent contracts |
| Models vs migrations | Attribute/type/null drift | Fresh-schema/runtime surprises |
| Tests | Direct DB writes/truncation; user tests commented; no chat/payment tests | Coverage exists but is unsafe/incomplete |

There is no request-schema validator, database transaction use, structured logger, rate limiting, Helmet/security headers, explicit sanitization, health/readiness endpoint, API versioning, OpenAPI documentation, or CI. The existing `api_doc_example.md` is an unrelated movie API template and does not document ISSA.

# Security Findings

| Severity | Finding | File evidence | Required action before public demo |
|---|---|---|---|
| Critical | Committed JWT, Midtrans, email, and DB/demo credentials | `helpers/index.js`, `controllers/transactionController.js`, `helpers/nodemailer.js`, `config/config.json`, seed/test data | Revoke/rotate; purge from active configuration; use environment secrets; consider git-history exposure |
| Critical | No resource authorization / broad IDOR | `middlewares/authorization.js`; student/class/attendance/score/payment/chat controllers | Add server-derived scope checks; hide unsafe mutations until complete |
| High | Client can mark payment successful | `routes/public.js:17`, `publicController.successPayment` | Remove endpoint or make webhook-only |
| High | Socket.IO unauthenticated and room-controlled | `middlewares/socketio.js:7-28` | Hide/mock chat or authenticate/authorize rooms |
| High | Teacher list exposes password hashes | `teacherController.allTeacher` | Exclude password and sensitive fields |
| High | JWT never expires and uses hardcoded secret | `helpers/index.js:10-11` | Environment key, expiry, typed claims, rotation |
| Medium | Global wildcard HTTP/Socket CORS | `app.js:16`, `middlewares/socketio.js:7-11` | Restrict to exact demo origins |
| Medium | No rate limiting on logins or writes | route/app middleware | Add per-IP/account limits |
| Medium | Missing validation and numeric/ownership constraints | controllers/models | Schema validation and explicit DTOs |
| Medium | Raw errors/data logged | controllers and error handler | Sanitized structured logging |
| Medium | Destructive unscoped class/student deletes and reset scripts | controllers; `package.json` | Hide destructive UI/routes; isolate demo DB; guard scripts |
| Low/Medium | Raw SQL string construction | `publicController.statistic` | Parameterize or use Sequelize aggregation |

SQL injection is not directly proven because the interpolated statistic ID comes from an authenticated database lookup, not direct request text. It is still unsafe practice and the identity selected is likely wrong. Runtime verification is required for actual database permissions and exposure.

# Revival Blockers

“Major static blocker count” below means P0 plus P1: **10 total (1 P0, 9 P1)**.

| Priority | Location | Issue/evidence | Probable impact | Recommended action | Effort | Runtime verification required? |
|---|---|---|---|---|---:|---|
| P0 | `package.json`, repository root | `main` is missing `index.js`; no `start` script | Common deployment/npm start cannot launch | Establish supported Node version and explicit boot entry after approval | 0.5–1h | Yes |
| P1 | secret locations listed above | Multiple committed credentials; hardcoded non-expiring JWT secret | Account/service compromise and forged tokens | Rotate/revoke and move to environment configuration | 2–6h plus provider work | No for evidence; yes to validate rotation |
| P1 | `middlewares/authorization.js`, protected controllers | No role/ownership authorization | Cross-student/class access and mutation | Add role + class/student scope; hide unsafe routes first | 8–16h | Yes |
| P1 | `scheduleController.js:1,8-13,23-27` | Missing Lesson import; TeacherId used as ClassId | Teacher schedule views fail/return wrong data | Correct include/import and resolve caller class | 1–3h | Yes |
| P1 | `publicController.js:98,131`; `authentication.js:29-32` | User ID used where Student ID is expected | Wrong payment/statistics data | Carry `StudentId` in auth context and query by it | 2–4h | Yes |
| P1 | `teacherController.js:10-21` | Null teacher/class dereference | Invalid login/no-class teacher produces 500 | Null-safe lookup and explicit membership response | 2–4h | Yes |
| P1 | transaction/public payment controllers | IDOR, committed key, no webhook/order persistence, client-paid PATCH | Unsafe/fake payment state | Replace with seeded stub for portfolio | 3–6h | Yes for UI contract |
| P1 | Socket.IO/chat controllers/models | Unauthenticated rooms, arbitrary IDs, collisions | Message impersonation/data disclosure | Hide/mock; redesign if retained | 1h hide; 12–24h revive | Yes |
| P1 | `transactionController.allTransactions` | GET discards rows and returns 201 message | CMS payment page lacks data | Return safe list/status DTO or stub | 1–3h | Yes |
| P1 | models/migrations/attendance seeder | Field/type/schema drift and overwritten history dates | Missing fields, bad demo data, uncertain migrations | Reconcile narrow demo schema and new synthetic seed set | 6–12h | Yes |
| P2 | attendance/score controllers | Ambiguous update keys and stale derived fields | Incorrect grades/attendance | Use explicit record/date IDs and transactions | 6–12h | Yes |
| P2 | app/CORS/error/logging | Wildcard CORS, raw logs, no rate limiting/security middleware | Avoidable public-demo exposure | Restrict origins, sanitize logs, rate limit | 3–6h | Yes |
| P2 | test suites | DB-destructive integration setup; gaps | Low confidence in repairs | Isolate demo test DB and add auth/schedule core tests | 8–16h | Yes |
| P3 | dead/unused code | `postgres`, `axios` import, `users`, `getIO`, Uniform, empty score helper, sandbox script | Noise/maintenance cost | Remove only after revival is stable | 2–4h | No |

# Revival Scenarios

## A. Revive original backend

Preserve all routes/schema and repair auth, chat, Midtrans, email, migrations, tests, and deployment.

- Estimate: **70–110 hours / 9–14 working days** for a demo-capable restoration; more if frontend contracts differ.
- Risk: **high**. Chat/payment can consume the entire window and security testing would be compressed.
- Fit: possible at the edge of two weeks, but not recommended.

## B. Build a limited compatibility backend

Keep this Express/Sequelize repository and route names, but support only the demonstrated parent/CMS flows. Use a corrected subset of the schema and deterministic synthetic data; do not attempt real payment/chat.

- Estimate: **40–64 hours / 5–8 working days** for minimum compatibility, then 1–3 days polish.
- Risk: **medium**. Main uncertainty is actual frontend payload/response behavior.
- Fit: best engineering/value balance. This is the recommended implementation style under the final verdict.

## C. Use a mock/demo backend

Return fixed/seeded responses, simplified auth, no real payment, and mock/remove chat.

- Estimate: **18–30 hours / 3–4 working days**.
- Risk: **low** for demo availability, but lower backend credibility.
- Fit: fallback if runtime verification exposes deep migration/Node issues or less than one week remains.

# Portfolio Value

- Technical depth: **good for a junior/early-career portfolio** because it spans two clients, authentication, relational modeling, reporting, realtime events, and a payment concept.
- Business logic: attendance, score/assignment/lesson relationships, class-scoped schedules, fee status, teacher feedback, and parent communication create a coherent domain.
- Backend complexity: moderate; breadth is stronger than implementation rigor.
- Originality: stronger than a generic shop/todo app because the two-sided school workflow is understandable and demoable.
- Bootcamp CRUD risk: high if presented as “many endpoints” without discussing authorization, data integrity, and revival decisions.
- Strongest engineering proof: cross-client contract design, relational associations, migration/seed reconstruction, and repairing authorization/data integrity with evidence.
- Weakest proof: current payment and chat are prototypes, not production integrations; tests cannot currently substantiate reliability.
- Credibility comes from showing a narrow end-to-end workflow with safe demo data and honestly documenting static findings, tradeoffs, and before/after architecture.
- It will look junior if every legacy feature is exposed, secrets remain committed, payment is described as real, or success is claimed solely because routes exist.
- The case study should explain the legacy audit, identity mismatch, schema drift, ownership policy, reduced scope, why payment/chat were stubbed, and what runtime evidence was collected after approval.

# Recommended Revival Scope

## Preserve

- Express 4 route organization and existing frontend-compatible paths.
- PostgreSQL/Sequelize core entities: Teacher, Class, Student, User, Lesson, Assignment, Score, Attendance, Schedule, Activity.
- Parent and teacher login concepts, bcrypt, migrations as historical references, and synthetic seed breadth.

## Fix for the live demo

- Boot/start contract and pinned Node version.
- Rotated environment configuration and safe demo credentials.
- Typed JWT claims with expiry and parent/teacher roles.
- Teacher class ownership and parent StudentId ownership.
- Parent profile, attendance, scores, schedules, activities, and statistics.
- Teacher login, student list/detail, attendance update, score update, and schedule view.
- Activity description/model alignment, schedule controller, identity mapping, and stable response DTOs.
- Exact-origin CORS, sanitized logging, rate limiting, and a non-destructive demo database workflow.

## Mock

- Payment as seeded status only; optionally a disabled “demo checkout” explanation.
- Chat as a static conversation preview only if the frontend layout needs it.

## Hide

- Midtrans checkout, payment-success PATCH, email sending, live Socket.IO, teacher registration, class deletion, lesson deletion, and broad admin mutations.

## Remove from demo navigation

- Uniform, sandbox script, unfinished final-score helper, irrelevant API document, and any screen whose only path depends on unsafe/unfinished behavior. Code cleanup itself should wait until after core revival approval.

Smallest credible demo:

1. Parent logs in and views own student profile, attendance, scores, schedule, activities, and a clearly labeled demo payment status.
2. Teacher logs in, sees only their class, opens student detail, records attendance, updates one score, and views the schedule.
3. A second browser refresh shows persisted changes in the parent view.

# Time Estimate

| Target | Hours | Working days | Assumptions |
|---|---:|---:|---|
| Static audit confidence | 85–90% structural; 60–70% behavioral | — | Every repository file relevant to requested areas inspected; nothing executed; frontend absent |
| Minimum live demo revival | 40–64h | 5–8 days | Full-time work, hide chat/payment/admin deletion, one synthetic DB, limited endpoints |
| Portfolio-quality revival | 64–96h | 8–12 days | Adds authorization, security baseline, stable DTOs, tests, deployment, case-study evidence |
| Production-quality revival | 200–320h | 25–40 days | Real payment/chat, full validation, observability, backups, security testing, ops, privacy work |

Major uncertainties are Node/dependency behavior, migration/seed success, exact frontend contracts, Postgres version, current frontend buildability, hosting constraints, and whether committed credentials remain active. All require runtime verification.

# Runtime Verification Checklist

Only after explicit approval and secret rotation:

- Confirm clean git state and isolate a disposable demo branch/database.
- Select a supported Node version based on lockfile install results; record exact Node/npm/PostgreSQL versions.
- Install from lockfile without upgrading and record dependency-resolution warnings.
- Verify `app.js` module loading, explicit boot command, graceful shutdown, and port binding.
- Run migrations against a disposable empty database; inspect every table/constraint.
- Run corrected seeders and verify counts/relationships/date history.
- Exercise both logins: valid, invalid, missing class/student, expired/forged token.
- Compare every retained endpoint with actual frontend network requests and state fields.
- Verify ownership using two teachers/classes and two parent/student accounts.
- Verify attendance uniqueness/date semantics and score update targeting.
- Verify parent/CMS schedule ordering and day normalization.
- Confirm no response/log exposes password hashes, tokens, DB details, or secrets.
- Confirm exact CORS origins, rate limits, deployment health/readiness, and HTTPS.
- Keep Midtrans/email/Socket.IO disabled unless separately approved and secured.
- Run only reviewed tests against an isolated test DB; never run reset scripts against shared data.

# Exact Next Actions

No fixes were performed. After explicit approval, proceed in this order:

1. Revoke/rotate every committed JWT, Midtrans, Gmail, database, and demo credential; treat git history as exposed.
2. Freeze portfolio scope to the two end-to-end flows above; formally mark chat and external payment out of scope.
3. Create an isolated revival branch and disposable PostgreSQL database; document a no-production-data rule.
4. Pin the first verification environment to a plausible legacy Node line (start with Node 18, then Node 16 only if required) without dependency upgrades.
5. Establish a valid start entry and separate app construction from listener startup.
6. Reconcile only retained model/migration fields and create new synthetic, date-stable demo data.
7. Implement typed expiring auth plus parent StudentId and teacher ClassId ownership checks before feature repair.
8. Repair login null handling, schedule reads, parent identity queries, attendance targeting, score targeting, and response DTOs.
9. Replace payment endpoints with a safe demo-status response and disable email/external calls; remove chat from live navigation.
10. Compare retained routes against both actual frontends, add focused isolated integration tests, deploy privately, then perform the runtime checklist before public launch.

Stop here and wait for explicit approval before making any fix, installing anything, running the server/tests/migrations/seeders, connecting to a database, or calling an external service.
