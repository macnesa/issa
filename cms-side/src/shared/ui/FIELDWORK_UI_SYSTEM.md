# Fieldwork UI System

The active experience direction is **Fieldwork**: a light-first teacher operations workspace built around work context rather than administrative page categories.

This document describes the visual and interaction contract for the current CMS
shell and active teacher workflows. Backend contracts, authorization, offline
sync, AI review boundaries, and record semantics remain independent of this UI
system.

Domain semantics and UI truth boundaries are governed separately by `FIELDWORK_DOMAIN_MODEL.md` at the repository root. Existing API/data support and known semantic gaps are mapped in `FIELDWORK_DATA_CONTRACT_AUDIT.md`. The UI system must not invent claims beyond those contracts.

## Product model

The primary user-facing domains are:

- **Hari ini** — operational triage: unfinished work, the next class rhythm, and student signals that need attention now.
- **Siswa** — roster + contextual student record workspace.
- **Kelas** — konteks kelas terlebih dahulu, lalu kehadiran dan jadwal sebagai mode kerja di dalamnya.
- **Catat** — tindakan terfokus yang mengubah catatan kelas menjadi draf yang dapat ditinjau.

Student records use **Ringkasan / Perjalanan / Penilaian**. Mode aktif disimpan di URL agar konteks bertahan saat berpindah siswa, refresh, dan back/forward. On desktop the roster
and record can coexist; on compact layouts the roster becomes the entry surface
and the selected record becomes a full workspace.

## Visual principles

1. **Content is the interface.** Chrome stays quiet so student and class data
   carry the hierarchy.
2. **Open regions before cards.** Fine dividers and spacing define most groups.
   Elevated/boxed surfaces are reserved for dialogs, popovers, editors, drafts,
   previews, and other real interaction boundaries.
3. **Human operational density.** Daily work remains compact without becoming a
   ledger or generic enterprise dashboard.
4. **Semantic color.** The main accent communicates selection/action. Success,
   warning, danger, and info colors are reserved for state.
5. **Context preservation.** Record navigation should not unnecessarily discard
   roster or class context.
6. **Motion has a job.** Shared 120–220 ms motion supports feedback, focus,
   state, and continuity only.
7. **Responsive transformation.** Desktop master-detail structures become
   list-to-record flows on compact screens; tables transform according to the
   task rather than merely shrinking.

## Semantic token contract

`src/index.css` owns canonical token values. Fieldwork uses warm-mineral page
surfaces, deep ink text, a restrained green-teal accent, low-contrast dividers,
and reduced geometry.

- Controls: `0.5rem` radius.
- Grouped surfaces: `0.625rem` radius when a surface is genuinely needed.
- Dialogs/popovers: `0.75rem` radius with the strongest shared elevation.
- Default hierarchy border: `1px`.
- Page content maximum: `92rem`, with workspace routes allowed to opt into
  full-width compositions.

Legacy aliases in `src/index.css` remain only for compatibility with feature
code that has not yet been renamed.

## Typography

Plus Jakarta Sans remains the system font. Product interfaces use compact page
headings, restrained weight, low tracking, and normal-case metadata. Oversized
marketing typography, decorative eyebrow stacking, and universal uppercase are
not part of the authenticated workspace language.

## Navigation and shell

- Desktop: compact light navigation rail.
- Compact layouts: fixed four-action bottom navigation for Hari ini, Siswa,
  Kelas, dan Catat.
- `Cmd/Ctrl + K` search remains a global utility rather than another navigation
  destination.
- Offline/sync state remains available in the shell.
- Mobile content reserves clearance for the fixed navigation and safe-area
  inset.

## Shared primitives

- `PageContainer`: standard route gutters and focus target.
- `PageHeader` / `SectionHeader`: open hierarchy without mandatory cards.
- `Surface`: explicit interaction/group boundary, not default section chrome.
- `LedgerShell`: legacy component name; visually it is now an open divided
  information region.
- `StudentContextHeader`: record identity and factual context.
- `WorkspaceTabs` / `WorkspacePanel`: keyboard-accessible record modes.
- Shared buttons/forms/statuses retain consistent focus, disabled, loading,
  error, and demo-state behavior.

## Current overwrite coverage

Fieldwork currently covers Login, global shell/navigation, Hari ini, Siswa
master-detail, Ringkasan/Perjalanan/Penilaian siswa, Kehadiran/Jadwal kelas,
Catat/Classroom Debrief, Perhatian, shared record sections, command palette,
and offline/sync presentation. Hari ini memakai seluruh halaman roster yang tersedia untuk status kelas dan sekarang berfungsi sebagai triage surface: status kehadiran tidak diulang sebagai KPI, jadwal berikutnya dipisahkan dari pekerjaan yang belum selesai, dan attention queue dapat menampilkan beberapa alasan yang relevan untuk satu siswa. Kelas memiliki landing context sendiri dengan explanatory copy yang ditekan seminimal mungkin. Pada record Siswa yang panjang, workspace tabs tetap tersedia saat scroll; compact layouts juga mempertahankan identitas siswa pada continuity strip. Editor Perjalanan/Penilaian dibuka secara kontekstual agar history tetap menjadi fokus utama.

The overwrite changes information hierarchy, navigation presentation,
responsive composition, and interaction surfaces. It does **not** authorize
changes to API contracts, backend behavior, auth, offline synchronization,
student record ownership, or the AI draft → teacher review → save boundary.


## Data truth boundary

Visual empty/loading/error treatment must follow `../data/RESOURCE_TRUTH_CONTRACT.md` and `../data/resourceTruth.js`. Fieldwork UI must not infer that a history is empty from a failed request, an unavailable record family, or a partial offline snapshot. Composite surfaces such as Ringkasan and Perjalanan disclose degraded coverage while continuing to show usable records.


## UI/UX finalization lock

The authenticated teacher experience is now considered structurally complete for the Fieldwork phase. Further UI work should be evidence-backed reconciliation only: runtime defects, accessibility regressions, responsive breakage, or demonstrated task friction. Do not reopen the primary IA, shell model, Student workspace ontology, or visual direction as routine polish.
