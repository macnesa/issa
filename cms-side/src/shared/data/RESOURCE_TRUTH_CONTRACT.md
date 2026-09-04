# Fieldwork Resource Truth Contract

**Runtime implementation:** `src/shared/data/resourceTruth.js`

This contract is the client-side boundary between raw data availability and what Fieldwork is allowed to claim in the UI. It does not change API payloads or backend persistence.

## Status

- `loading` — resolution is still in progress. Do not claim empty.
- `known` — usable non-empty data resolved within the declared scope.
- `empty` — the source resolved successfully and the declared scope is genuinely empty.
- `error` — the source failed to resolve. Do not convert failure to `[]`/empty language.
- `unavailable` — the record family is not present in this projection/context, such as Scores or standalone Evidence in the minimum offline snapshot.
- `partial` — usable data exists, but completeness or freshness is explicitly limited.
- `pending` — local teacher intent is visible but not yet server-confirmed.
- `conflicted` — local and server truth diverge and require reconciliation.

## Provenance

- `server` — authoritative server response within its returned scope.
- `snapshot` — local cached projection; always treated as limited in freshness/completeness where appropriate.
- `local_pending` — locally persisted teacher intent awaiting server confirmation.
- `derived` — client/server projection composed from other records; not a new canonical record.
- `draft` — non-canonical generated or edited material awaiting teacher decision.

## Non-negotiable rules

1. `empty` requires successful resolution of the relevant source and scope.
2. `error` and `unavailable` are never rendered as empty history.
3. A snapshot does not prove current server completeness.
4. A composite projection such as Perjalanan inherits the weakest relevant source boundary; available records may still be shown, but the UI must disclose partial coverage.
5. Pending/conflicted local intent is not described as server-saved canonical truth.
6. Resource state is orthogonal to business-domain status. For example, Attendance `status: Hadir` is not a Resource Truth status.

## Initial migrated surfaces

- Student Learning Journal
- Student Evidence
- Feedback history
- Student Ringkasan resource presentation
- Student Perjalanan composite completeness
- Attendance/Scores contribution to the Student composite projection

Future migrations should reuse the shared factories/selectors rather than inventing another `{ loading, error, data }` convention.
