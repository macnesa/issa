import { tw } from "../../../shared/ui/tw";

const dayLabels = { Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat" };

export default function ScheduleList({ days, schedulesByDay }) {
  return (
    <div className={tw("schedule-week min-w-0 border-y border-issa-border lg:grid lg:grid-cols-5 lg:divide-x lg:divide-issa-border")}>
      {days.map((day) => {
        const items = schedulesByDay[day] || [];
        return (
          <section key={day} className={tw("min-w-0 px-0 py-4 lg:px-4 lg:first:pl-0 lg:last:pr-0 max-lg:border-b max-lg:border-issa-border max-lg:last:border-b-0")} aria-labelledby={`schedule-${day}`}>
            <div className={tw("mb-3 flex items-baseline justify-between gap-3")}>
              <h2 id={`schedule-${day}`} className={tw("text-supporting font-semibold text-issa-text")}>{dayLabels[day] || day}</h2>
              <span className={tw("text-metadata tabular-nums text-issa-muted")}>{items.length}</span>
            </div>
            {items.length ? (
              <ol className={tw("m-0 list-none p-0")}>
                {items.map((schedule, index) => (
                  <li key={schedule.id || `${day}-${index}`} className={tw("grid grid-cols-[1.5rem_minmax(0,_1fr)] gap-2 border-t border-issa-border py-3 first:border-t-0 first:pt-0")}>
                    <span className={tw("pt-0.5 text-metadata tabular-nums text-issa-muted")}>{String(index + 1).padStart(2, "0")}</span>
                    <div className={tw("min-w-0")}>
                      <strong className={tw("block text-supporting font-semibold text-issa-text")}>{schedule.Lesson?.name || schedule.name || "Pelajaran"}</strong>
                      {(schedule.startTime || schedule.endTime) && <span className={tw("mt-1 block text-metadata text-issa-muted")}>{schedule.startTime || ""}{schedule.endTime ? `–${schedule.endTime}` : ""}</span>}
                      {schedule.Lesson?.KKM !== undefined && schedule.Lesson?.KKM !== null && <span className={tw("mt-1 block text-metadata text-issa-muted")}>KKM {schedule.Lesson.KKM}</span>}
                      {schedule.Teacher?.name && <span className={tw("mt-1 block text-metadata text-issa-muted")}>{schedule.Teacher.name}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className={tw("text-metadata text-issa-muted")}>Tidak ada jadwal.</p>}
          </section>
        );
      })}
    </div>
  );
}
