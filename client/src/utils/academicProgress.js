function isValidScoreValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function compareRecords(left, right) {
  const leftDate = new Date(left.recordedAt).getTime();
  const rightDate = new Date(right.recordedAt).getTime();
  const leftTimestamp = Number.isNaN(leftDate) ? Number.NEGATIVE_INFINITY : leftDate;
  const rightTimestamp = Number.isNaN(rightDate) ? Number.NEGATIVE_INFINITY : rightDate;

  if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp;
  return String(left.id ?? '').localeCompare(String(right.id ?? ''), 'id');
}

function createLessonRecord(score) {
  return {
    id: score.lessonId ?? score.lesson?.id ?? null,
    name: score.lesson?.name || 'Mata pelajaran',
    kkm: score.lesson?.kkm !== null && score.lesson?.kkm !== undefined && score.lesson?.kkm !== '' && Number.isFinite(Number(score.lesson.kkm))
      ? Number(score.lesson.kkm)
      : null,
    records: [],
  };
}

function summarizeLesson(lesson) {
  const values = lesson.records.map((record) => Number(record.value));
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    ...lesson,
    assessmentCount: values.length,
    average: values.length ? total / values.length : null,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    records: lesson.records.slice().sort(compareRecords),
  };
}

export function getProgressOverview(scores) {
  const lessons = new Map();
  const values = [];

  scores.forEach((score) => {
    if (!isValidScoreValue(score.value)) return;

    const lessonId = score.lessonId ?? score.lesson?.id ?? null;
    const key = lessonId ?? score.lesson?.name ?? 'unknown';
    const lesson = lessons.get(key) || createLessonRecord(score);

    lesson.records.push(score);
    lessons.set(key, lesson);
    values.push(Number(score.value));
  });

  const groupedLessons = Array.from(lessons.values())
    .map(summarizeLesson)
    .sort((left, right) => left.name.localeCompare(right.name, 'id') || String(left.id ?? '').localeCompare(String(right.id ?? ''), 'id'));

  return {
    lessonCount: groupedLessons.length,
    assessmentCount: values.length,
    overallAverage: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    lessons: groupedLessons,
  };
}

export function getLessonProgress(scores, lessonId) {
  const matchingScores = scores.filter((score) => String(score.lessonId ?? score.lesson?.id) === String(lessonId));
  const validScores = matchingScores.filter((score) => isValidScoreValue(score.value));

  if (!matchingScores.length) return null;

  const lesson = createLessonRecord(matchingScores[0]);
  lesson.records = validScores;
  return summarizeLesson(lesson);
}
