import { tw } from "../../../shared/ui/tw";
import { LedgerShell, Surface } from "../../../shared/ui/ui";

export default function ScheduleList({ days, schedulesByDay }) {
  const dayLabels = { Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat" };
  return <LedgerShell className={tw("weekly-timetable")} eyebrow="Jadwal mingguan" title="Lima hari sekolah"><div className={tw("weekly-timetable__days grid gap-3 p-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(5,_minmax(0,_1fr))]")}>{days.map((day) => {
    const entries = schedulesByDay[day] || [];
    return <Surface as="section" key={day} className={tw("weekly-timetable__day min-w-0 overflow-hidden")}><div className={tw("weekly-timetable__day-header border-b border-issa-border p-3 bg-issa-subtle")}><h2 className={tw("weekly-timetable__day-name text-issa-text text-section-title font-bold")}>{dayLabels[day] || day}</h2></div>{entries.length ? <ul className={tw("weekly-timetable__lessons m-0 p-0 list-none")}>{entries.map((schedule) => <li key={schedule.id} className={tw("weekly-timetable__lesson p-3 [&+&]:border-t [&+&]:border-issa-border")}><p className={tw("weekly-timetable__lesson-name text-issa-text text-body font-semibold leading-normal")}>{schedule.Lesson?.name || "Mata pelajaran belum tersedia"}</p><span className={tw("weekly-timetable__lesson-kkm block mt-1 text-issa-muted text-metadata")}>{schedule.Lesson?.KKM != null ? `KKM ${schedule.Lesson.KKM}` : "KKM —"}</span></li>)}</ul> : <p className={tw("weekly-timetable__empty block p-3 mt-1 text-issa-muted text-metadata")}>Belum ada mata pelajaran.</p>}</Surface>;
  })}</div></LedgerShell>;
}
