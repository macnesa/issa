export default function ScheduleList({ day, lessons }) {
  return (
    <section className="schedule-day">
      <h2>{day}</h2>
      <ul>
        {lessons.map((lesson, index) => (
          <li key={`${day}-${lesson}-${index}`}>{lesson}</li>
        ))}
      </ul>
    </section>
  );
}
