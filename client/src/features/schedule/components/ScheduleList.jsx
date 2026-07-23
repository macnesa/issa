export default function ScheduleList({ day: scheduleDay, lessons: lessonNames }) {
  return (
    <section className="schedule-day">
      <h2>{scheduleDay}</h2>
      <ul>
        {lessonNames.map((lessonName, lessonIndex) => (
          <li key={`${scheduleDay}-${lessonName}-${lessonIndex}`}>{lessonName}</li>
        ))}
      </ul>
    </section>
  );
}
