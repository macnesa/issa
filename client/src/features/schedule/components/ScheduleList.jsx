export default function ScheduleList({ day: scheduleDay, lessons: lessonNames }) {
  return (
    <section className="overflow-hidden rounded-[0.85rem_1.85rem_0.85rem_0.85rem] border border-[#c9e8e7] bg-[#f8ffff]">
      <h2 className="m-0 bg-[rgba(107,191,188,0.17)] px-[1.1rem] py-[0.85rem] text-[0.9rem] [font-weight:850] text-[#315f62]">{scheduleDay}</h2>
      <ul className="m-0 list-none px-[1.1rem] py-[0.35rem]">
        {lessonNames.map((lessonName, lessonIndex) => (
          <li className="flex items-center gap-[0.54rem] py-[0.75rem] text-[0.92rem] font-bold text-[#315f62]" key={`${scheduleDay}-${lessonName}-${lessonIndex}`}>
            <span className="h-[0.46rem] w-[0.46rem] shrink-0 rounded-full bg-[#6bbfbc]" aria-hidden="true" />
            <span>{lessonName}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
