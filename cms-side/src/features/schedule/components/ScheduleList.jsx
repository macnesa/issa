import { LedgerShell, Surface } from "../../../shared/ui/ui";

export default function ScheduleList({ days, schedulesByDay }) {
  const dayLabels = { Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat" };
  return <LedgerShell className="weekly-timetable" eyebrow="Jadwal mingguan" title="Lima hari sekolah"><div className="weekly-timetable__days">{days.map((day) => {
    const entries = schedulesByDay[day] || [];
    return <Surface as="section" key={day} className="weekly-timetable__day"><div className="weekly-timetable__day-header"><h2 className="weekly-timetable__day-name">{dayLabels[day] || day}</h2></div>{entries.length ? <ul className="weekly-timetable__lessons">{entries.map((schedule) => <li key={schedule.id} className="weekly-timetable__lesson"><p className="weekly-timetable__lesson-name">{schedule.Lesson?.name || "Mata pelajaran belum tersedia"}</p><span className="weekly-timetable__lesson-kkm">{schedule.Lesson?.KKM != null ? `KKM ${schedule.Lesson.KKM}` : "KKM —"}</span></li>)}</ul> : <p className="weekly-timetable__empty">Belum ada mata pelajaran.</p>}</Surface>;
  })}</div></LedgerShell>;
}
