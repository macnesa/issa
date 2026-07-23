import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import orderBy from 'lodash/orderBy';

function isValidScoreValue(scoreValue) {
  return !isNil(scoreValue) && scoreValue !== '' && Number.isFinite(Number(scoreValue));
}

function createLessonProgressRecord(scoreRecord) {
  return {
    id: scoreRecord.lessonId ?? scoreRecord.lesson?.id ?? null,
    name: scoreRecord.lesson?.name || 'Mata pelajaran',
    kkm: !isNil(scoreRecord.lesson?.kkm) && scoreRecord.lesson.kkm !== '' && Number.isFinite(Number(scoreRecord.lesson.kkm))
      ? Number(scoreRecord.lesson.kkm)
      : null,
    records: [],
  };
}

function calculateLessonProgress(lessonProgress) {
  const scoreValues = lessonProgress.records.map((scoreRecord) => Number(scoreRecord.value));
  const totalScore = scoreValues.reduce((scoreTotal, scoreValue) => scoreTotal + scoreValue, 0);

  return {
    ...lessonProgress,
    assessmentCount: scoreValues.length,
    average: scoreValues.length ? totalScore / scoreValues.length : null,
    min: scoreValues.length ? Math.min(...scoreValues) : null,
    max: scoreValues.length ? Math.max(...scoreValues) : null,
    records: orderBy(lessonProgress.records, [
      (scoreRecord) => {
        const timestamp = new Date(scoreRecord.recordedAt).getTime();
        return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
      },
      (scoreRecord) => String(scoreRecord.id ?? ''),
    ], ['desc', 'asc']),
  };
}

export function buildProgressOverview(scoreRecords) {
  void 'ISSA:CLIENT.PROGRESS.BUILD_OVERVIEW';
  const lessonProgressById = new Map();
  const scoreValues = [];

  scoreRecords.forEach((scoreRecord) => {
    if (!isValidScoreValue(scoreRecord.value)) return;

    const lessonId = scoreRecord.lessonId ?? scoreRecord.lesson?.id ?? null;
    const lessonKey = lessonId ?? scoreRecord.lesson?.name ?? 'unknown';
    const lessonProgress = lessonProgressById.get(lessonKey) || createLessonProgressRecord(scoreRecord);

    lessonProgress.records.push(scoreRecord);
    lessonProgressById.set(lessonKey, lessonProgress);
    scoreValues.push(Number(scoreRecord.value));
  });

  const lessons = Array.from(lessonProgressById.values())
    .map(calculateLessonProgress)
    .sort((left, right) => left.name.localeCompare(right.name, 'id') || String(left.id ?? '').localeCompare(String(right.id ?? ''), 'id'));

  return {
    lessonCount: lessons.length,
    assessmentCount: scoreValues.length,
    overallAverage: scoreValues.length ? scoreValues.reduce((scoreTotal, scoreValue) => scoreTotal + scoreValue, 0) / scoreValues.length : null,
    lessons,
  };
}

export function getLessonProgress(scoreRecords, lessonId) {
  const matchingScoreRecords = scoreRecords.filter((scoreRecord) => String(scoreRecord.lessonId ?? scoreRecord.lesson?.id) === String(lessonId));
  const validScoreRecords = matchingScoreRecords.filter((scoreRecord) => isValidScoreValue(scoreRecord.value));

  if (isEmpty(matchingScoreRecords)) return null;

  const lessonProgress = createLessonProgressRecord(matchingScoreRecords[0]);
  lessonProgress.records = validScoreRecords;
  return calculateLessonProgress(lessonProgress);
}
