import { Surface } from '../../../shared/ui/ui';

export default function ScheduleList({ day: scheduleDay, lessons: lessonNames }) {
  return (
    <Surface className="schedule-day" padded={false}>
      <h2>{scheduleDay}</h2>
      <ul>
        {lessonNames.map((lessonName, lessonIndex) => (
          <li key={`${scheduleDay}-${lessonName}-${lessonIndex}`}>
            <span aria-hidden="true" />
            <strong>{lessonName}</strong>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
