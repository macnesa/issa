# Fieldwork Workflow Ownership

Fieldwork may expose multiple shortcuts, but every teacher job has one canonical owner.

## Primary anchors

- `Hari ini` — triage only: what needs attention now.
- `Kelas` — class operations: attendance, schedule, roster context.
- `Siswa` — one-student context: summary, journey, assessment, individual notes/evidence/feedback.
- `Catat kelas` — post-class batch capture: teacher narrative -> AI drafts -> teacher review -> canonical records.

## Canonical ownership

| Job | Canonical owner |
| --- | --- |
| Mark or edit attendance | `Kelas -> Kehadiran` |
| Read attendance in a student's history | `Siswa -> Perjalanan` |
| View class schedule | `Kelas -> Jadwal` |
| Understand one student | `Siswa` |
| Add an individual journal note | `Siswa -> Perjalanan -> Tambah -> Catatan` |
| Add evidence | `Siswa -> Perjalanan -> Tambah -> Bukti` |
| Add individual feedback | `Siswa -> Perjalanan -> Tambah -> Feedback` |
| View or record assessment | `Siswa -> Penilaian` |
| Capture several post-class events at once | `Catat kelas` |

## Shortcut rule

A shortcut may skip intermediate clicks, but its destination must reveal the canonical owner immediately.

Examples:

- `Hari ini -> Kehadiran belum selesai` may open `/attendance` directly because that screen visibly lives inside the Kelas workspace.
- An attendance event in `Siswa -> Perjalanan` may link to `/attendance` with the same student and date focused. It must not provide a second attendance editor inside the student record.
- Journal or feedback search results open the student's `Perjalanan`, not an unrelated summary screen.

## Progressive disclosure

Do not show all write capabilities at once.

`Siswa -> Perjalanan` is read-first. The single `Tambah` action reveals only individual student record types owned there: Catatan, Bukti, Feedback.

Technical complexity belongs behind these boundaries. New UI entry points should not create a second owner for an existing job.
