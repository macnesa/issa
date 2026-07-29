const teacherSearchRepository = require('./teacher-search.repository');
const {
  validateTeacherSearchQuery,
} = require('./teacher-search.validator');

const JOURNAL_TYPE_LABELS = {
  observation: 'Observasi pembelajaran',
  strength: 'Kekuatan yang terlihat',
  challenge: 'Tantangan yang terlihat',
  milestone: 'Capaian pembelajaran',
  student_reflection: 'Refleksi siswa',
  support_note: 'Catatan dukungan',
};
const GROUP_DEFINITIONS = [
  { type: 'student', label: 'Siswa' },
  { type: 'journal', label: 'Jurnal pembelajaran' },
  { type: 'feedback', label: 'Feedback' },
  { type: 'lesson', label: 'Pelajaran' },
  { type: 'activity', label: 'Aktivitas sekolah' },
];
const MAX_CANDIDATES_PER_GROUP = 25;
const SNIPPET_MAX_LENGTH = 140;

function toPlainRecord(record) {
  return record && typeof record.get === 'function'
    ? record.get({ plain: true })
    : record;
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForMatch(value) {
  return normalizeText(value).toLocaleLowerCase('id-ID');
}

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function formatOccurredAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function buildSnippet(value, query) {
  const text = normalizeText(value);
  if (text.length <= SNIPPET_MAX_LENGTH) return text;

  const normalizedText = text.toLocaleLowerCase('id-ID');
  const normalizedQuery = normalizeForMatch(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  const desiredStart = matchIndex > 45 ? matchIndex - 45 : 0;
  const hasLeadingEllipsis = desiredStart > 0;
  const availableLength = SNIPPET_MAX_LENGTH - (hasLeadingEllipsis ? 1 : 0) - 1;
  const snippetBody = text.slice(desiredStart, desiredStart + availableLength).trim();
  const hasTrailingEllipsis = desiredStart + snippetBody.length < text.length;

  return `${hasLeadingEllipsis ? '…' : ''}${snippetBody}${hasTrailingEllipsis ? '…' : ''}`;
}

function matchRank(fields, normalizedQuery) {
  const normalizedFields = fields.map(normalizeForMatch).filter(Boolean);
  if (normalizedFields.some((field) => field === normalizedQuery)) return 0;
  if (normalizedFields.some((field) => field.startsWith(normalizedQuery))) return 1;
  if (normalizedFields.some((field) => field.includes(normalizedQuery))) return 2;
  return 3;
}

function compareIds(leftId, rightId) {
  return String(leftId).localeCompare(String(rightId), 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

function rankAndLimit(records, query, limit, rankingFields) {
  const normalizedQuery = normalizeForMatch(query);

  return records
    .map((record) => ({
      record,
      rank: matchRank(rankingFields(record), normalizedQuery),
      occurredAtTimestamp: record.rankingOccurredAt || record.occurredAt
        ? new Date(record.rankingOccurredAt || record.occurredAt).getTime()
        : Number.NEGATIVE_INFINITY,
    }))
    .sort((left, right) => (
      left.rank - right.rank
      || right.occurredAtTimestamp - left.occurredAtTimestamp
      || compareIds(left.record.id, right.record.id)
    ))
    .slice(0, limit)
    .map(({ record }) => record);
}

function matchingJournalTypes(query) {
  const normalizedQuery = normalizeForMatch(query);
  return Object.entries(JOURNAL_TYPE_LABELS)
    .filter(([type, label]) => (
      normalizeForMatch(type.replaceAll('_', ' ')).includes(normalizedQuery)
      || normalizeForMatch(label).includes(normalizedQuery)
    ))
    .map(([type]) => type);
}

function mapStudent(record, query) {
  const student = toPlainRecord(record);
  return {
    id: student.id,
    title: normalizeText(student.name),
    subtitle: normalizeText(student.Class?.name),
    snippet: buildSnippet(`NIM ${student.NIM}`, query),
    studentId: student.id,
    occurredAt: null,
    rankingOccurredAt: student.updatedAt,
    rankingFields: [student.name, student.NIM, student.Class?.name],
  };
}

function mapJournal(record, query) {
  const journal = toPlainRecord(record);
  return {
    id: journal.id,
    title: JOURNAL_TYPE_LABELS[journal.type] || 'Catatan pembelajaran',
    subtitle: normalizeText(journal.Student?.name),
    snippet: buildSnippet(journal.content, query),
    studentId: journal.StudentId,
    occurredAt: formatOccurredAt(journal.observedAt),
    rankingOccurredAt: journal.observedAt,
    rankingFields: [
      JOURNAL_TYPE_LABELS[journal.type],
      String(journal.type || '').replaceAll('_', ' '),
      journal.Student?.name,
      journal.content,
    ],
  };
}

function mapFeedback(record, query) {
  const student = toPlainRecord(record);
  return {
    id: student.id,
    title: 'Feedback guru',
    subtitle: normalizeText(student.name),
    snippet: buildSnippet(student.feedback, query),
    studentId: student.id,
    occurredAt: formatOccurredAt(student.updatedAt),
    rankingOccurredAt: student.updatedAt,
    rankingFields: [student.name, student.feedback],
  };
}

function mapLesson(record, query) {
  const lesson = toPlainRecord(record);
  return {
    id: lesson.id,
    title: normalizeText(lesson.name),
    subtitle: 'Pelajaran',
    snippet: buildSnippet(lesson.desc || lesson.name, query),
    studentId: null,
    occurredAt: formatOccurredAt(lesson.updatedAt),
    rankingOccurredAt: lesson.updatedAt,
    rankingFields: [lesson.name, lesson.desc],
  };
}

function mapActivity(record, query) {
  const activity = toPlainRecord(record);
  return {
    id: activity.id,
    title: normalizeText(activity.name),
    subtitle: 'Aktivitas sekolah',
    snippet: buildSnippet(activity.desc || activity.name, query),
    studentId: null,
    occurredAt: formatOccurredAt(activity.date || activity.updatedAt),
    rankingOccurredAt: activity.date || activity.updatedAt,
    rankingFields: [activity.name, activity.desc],
  };
}

function shapeGroupItems(records, query, limit, mapper) {
  const mappedRecords = records.map((record) => mapper(record, query));
  return rankAndLimit(
    mappedRecords,
    query,
    limit,
    (record) => record.rankingFields
  ).map(({ rankingFields, rankingOccurredAt, ...safeRecord }) => safeRecord);
}

function shapeSearchResponse({ query, limit, recordsByGroup }) {
  void 'ISSA:SERVER.TEACHER_SEARCH.SHAPE_RESULTS';
  const mappers = {
    student: mapStudent,
    journal: mapJournal,
    feedback: mapFeedback,
    lesson: mapLesson,
    activity: mapActivity,
  };
  const groups = GROUP_DEFINITIONS
    .map(({ type, label }) => ({
      type,
      label,
      items: shapeGroupItems(
        recordsByGroup[type],
        query,
        limit,
        mappers[type]
      ),
    }))
    .filter((group) => group.items.length > 0);

  return {
    data: {
      query,
      total: groups.reduce((total, group) => total + group.items.length, 0),
      groups,
    },
  };
}

async function searchTeacherRecords({ requester, queryParameters }) {
  void 'ISSA:SERVER.TEACHER_SEARCH.AUTHORIZED';
  if (
    !requester
    || requester.role !== 'teacher'
    || !requester.classId
  ) {
    throw { name: 'unAuthentication' };
  }

  const { query, limit } = validateTeacherSearchQuery(queryParameters);
  const candidateLimit = Math.min(
    Math.max(limit * 5, 10),
    MAX_CANDIDATES_PER_GROUP
  );
  const searchOptions = {
    classId: requester.classId,
    pattern: `%${escapeLikePattern(query)}%`,
    candidateLimit,
  };

  try {
    const [student, journal, feedback, lesson, activity] = await Promise.all([
      teacherSearchRepository.findStudentCandidates(searchOptions),
      teacherSearchRepository.findJournalCandidates({
        ...searchOptions,
        matchingJournalTypes: matchingJournalTypes(query),
      }),
      teacherSearchRepository.findFeedbackCandidates(searchOptions),
      teacherSearchRepository.findLessonCandidates(searchOptions),
      teacherSearchRepository.findActivityCandidates(searchOptions),
    ]);

    return shapeSearchResponse({
      query,
      limit,
      recordsByGroup: { student, journal, feedback, lesson, activity },
    });
  } catch (error) {
    throw { name: 'teacher_search_unavailable' };
  }
}

module.exports = {
  buildSnippet,
  searchTeacherRecords,
  shapeSearchResponse,
};
