import { Surface } from "../../../shared/ui/ui";

export default function ScheduleList({ days, schedulesByDay }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{days.map((day) => {
    const entries = schedulesByDay[day] || [];
    return <Surface key={day} className="p-5"><h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{day}</h2>{entries.length ? <ul className="mt-4 divide-y divide-[var(--border)]">{entries.map((schedule) => <li key={schedule.id} className="py-3 first:pt-0 last:pb-0"><p className="font-medium text-[var(--text)]">{schedule.Lesson?.name || "Mata pelajaran belum tersedia"}</p><p className="mt-1 text-sm text-[var(--muted)]">{schedule.Lesson?.KKM != null ? `KKM ${schedule.Lesson.KKM}` : "Detail KKM belum tersedia"}</p></li>)}</ul> : <p className="mt-4 text-sm text-[var(--muted)]">Belum ada mata pelajaran.</p>}</Surface>;
  })}</div>;
}
