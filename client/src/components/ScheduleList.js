export default function ScheduleList({ day, lessons }) {
  return (
    <section className="surface overflow-hidden">
      <h2 className="border-b border-[var(--issa-border)] bg-[var(--issa-primary-soft)] px-5 py-3 text-sm font-semibold text-[var(--issa-primary)]">{day}</h2>
      <ul className="divide-y divide-[var(--issa-border)] px-5">
        {lessons.map((lesson, index) => (
          <li key={`${day}-${lesson}-${index}`} className="py-3 text-sm text-[var(--issa-text-secondary)]">{lesson}</li>
        ))}
      </ul>
    </section>
  );
}
