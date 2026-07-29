const groupBy = require('lodash/groupBy');
const isNil = require('lodash/isNil');
const studentInsightRepository = require('./student-insight.repository');
const { validateStudentId } = require('./student-insight.validator');

const attendanceWindowDays = 30;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const priorityRank = { high: 0, medium: 1, low: 2 };
const defaultTimeZone = 'Asia/Jakarta';

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function roundToOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function getScoreOccurredAt(score) {
  return score.recordedAt || score.createdAt || null;
}

function getAttendanceOccurredAt(attendance) {
  return attendance.attendanceDate || attendance.createdAt || null;
}

function compareRecordsChronologically(left, right, getOccurredAt) {
  const timeDifference =
    getTimestamp(getOccurredAt(left)) - getTimestamp(getOccurredAt(right));
  if (timeDifference !== 0) return timeDifference;
  return Number(left.id || 0) - Number(right.id || 0);
}

function getCalendarDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  function formatDateInTimeZone(timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );
    return `${values.year}-${values.month}-${values.day}`;
  }

  try {
    return formatDateInTimeZone(process.env.APP_TIMEZONE || defaultTimeZone);
  } catch (error) {
    return formatDateInTimeZone(defaultTimeZone);
  }
}

function getAttendanceWindowStart(requestCalendarDate) {
  const [year, month, day] = requestCalendarDate.split('-').map(Number);
  const windowStart = new Date(Date.UTC(year, month - 1, day));
  windowStart.setUTCDate(windowStart.getUTCDate() - (attendanceWindowDays - 1));
  return windowStart.toISOString().slice(0, 10);
}

function calculateAttendanceInsight(attendanceRecords, requestedAt = new Date()) {
  void 'ISSA:SERVER.STUDENT_INSIGHT.CALCULATE_ATTENDANCE';
  const requestCalendarDate = getCalendarDate(requestedAt);
  const windowStart = getAttendanceWindowStart(requestCalendarDate);
  const recordsInWindow = attendanceRecords.filter((attendance) => {
    const attendanceCalendarDate = getCalendarDate(
      getAttendanceOccurredAt(attendance)
    );
    return attendanceCalendarDate &&
      attendanceCalendarDate >= windowStart &&
      attendanceCalendarDate <= requestCalendarDate;
  });

  const totalsByStatus = {
    Hadir: 0,
    Izin: 0,
    Sakit: 0,
    Alfa: 0,
  };
  recordsInWindow.forEach((attendance) => {
    if (Object.prototype.hasOwnProperty.call(totalsByStatus, attendance.status)) {
      totalsByStatus[attendance.status] += 1;
    }
  });

  const recordedDays = recordsInWindow.length;
  const rate = recordedDays === 0
    ? 0
    : roundToOneDecimal((totalsByStatus.Hadir / recordedDays) * 100);
  const flag = recordedDays >= 5 && rate < 85
    ? { type: 'attendance_attention', rate, recordedDays }
    : null;

  return {
    insight: {
      windowDays: attendanceWindowDays,
      recordedDays,
      present: totalsByStatus.Hadir,
      permission: totalsByStatus.Izin,
      sick: totalsByStatus.Sakit,
      absent: totalsByStatus.Alfa,
      rate,
    },
    flag,
  };
}

function getSubjectTrend(scoresChronologically) {
  if (scoresChronologically.length < 3) return 'insufficient_data';

  const [first, second, third] = scoresChronologically.slice(-3);
  if (first.value < second.value && second.value < third.value) {
    return 'improving';
  }
  if (first.value > second.value && second.value > third.value) {
    return 'declining';
  }
  return 'stable';
}

function getOverallTrend(subjectTrends) {
  const sufficientTrends = subjectTrends.filter(
    (trend) => trend !== 'insufficient_data'
  );
  if (sufficientTrends.length === 0) return 'insufficient_data';

  const trendCounts = {
    improving: sufficientTrends.filter((trend) => trend === 'improving').length,
    declining: sufficientTrends.filter((trend) => trend === 'declining').length,
    stable: sufficientTrends.filter((trend) => trend === 'stable').length,
  };

  if (
    trendCounts.improving > trendCounts.declining &&
    trendCounts.improving > trendCounts.stable
  ) {
    return 'improving';
  }
  if (
    trendCounts.declining > trendCounts.improving &&
    trendCounts.declining > trendCounts.stable
  ) {
    return 'declining';
  }
  return 'stable';
}

function calculateAcademicInsight(scoreRecords) {
  void 'ISSA:SERVER.STUDENT_INSIGHT.CALCULATE_ACADEMICS';
  const scoresByLesson = groupBy(scoreRecords, 'LessonId');
  const subjectTrends = [];
  const latestGaps = [];
  const subjectsNeedingAttention = [];

  Object.values(scoresByLesson).forEach((subjectScores) => {
    const scoresChronologically = [...subjectScores].sort((left, right) =>
      compareRecordsChronologically(left, right, getScoreOccurredAt)
    );
    const latestScore = scoresChronologically.at(-1);
    const previousScore = scoresChronologically.at(-2);
    const lesson = latestScore.Lesson;

    subjectTrends.push(getSubjectTrend(scoresChronologically));
    latestGaps.push(Number(latestScore.value) - Number(lesson.KKM));

    if (
      previousScore &&
      Number(latestScore.value) < Number(lesson.KKM) &&
      Number(previousScore.value) < Number(lesson.KKM)
    ) {
      subjectsNeedingAttention.push({
        lessonId: lesson.id,
        lessonName: lesson.name,
        kkm: lesson.KKM,
        latestScores: [latestScore.value, previousScore.value],
        latestRecordedAt: getScoreOccurredAt(latestScore),
      });
    }
  });

  subjectsNeedingAttention.sort((left, right) => {
    const timeDifference =
      getTimestamp(right.latestRecordedAt) - getTimestamp(left.latestRecordedAt);
    if (timeDifference !== 0) return timeDifference;
    return left.lessonName.localeCompare(right.lessonName);
  });

  return {
    insight: {
      overallTrend: getOverallTrend(subjectTrends),
      averageGapFromKkm: latestGaps.length === 0
        ? null
        : roundToOneDecimal(
          latestGaps.reduce((total, gap) => total + gap, 0) / latestGaps.length
        ),
      subjectsNeedingAttention,
    },
    flags: subjectsNeedingAttention.map((subject) => ({
      type: 'academic_attention',
      ...subject,
    })),
  };
}

function calculateFeedbackInsight(feedbackRecords, requestedAt) {
  const feedbacksByLatest = [...feedbackRecords].sort((left, right) => {
    const timeDifference =
      getTimestamp(right.observedAt) - getTimestamp(left.observedAt);
    if (timeDifference !== 0) return timeDifference;
    return Number(right.id || 0) - Number(left.id || 0);
  });
  const latestFeedback = feedbacksByLatest[0];

  if (!latestFeedback) {
    return {
      insight: {
        latestObservedAt: null,
        daysSinceLatest: null,
      },
      flag: {
        type: 'feedback_stale',
        latestObservedAt: null,
        daysSinceLatest: null,
      },
    };
  }

  const latestObservedAt = latestFeedback.observedAt;
  const daysSinceLatest = Math.max(
    0,
    Math.floor(
      (getTimestamp(requestedAt) - getTimestamp(latestObservedAt)) /
        millisecondsPerDay
    )
  );
  const insight = { latestObservedAt, daysSinceLatest };

  return {
    insight,
    flag: daysSinceLatest > 30
      ? { type: 'feedback_stale', ...insight }
      : null,
  };
}

function getScoreDirection(previousScore, currentScore) {
  if (!previousScore) return 'first_record';
  if (currentScore.value > previousScore.value) return 'improved';
  if (currentScore.value < previousScore.value) return 'declined';
  return 'unchanged';
}

function buildRecentChanges(attendanceRecords, scoreRecords, feedbackRecords) {
  void 'ISSA:SERVER.STUDENT_INSIGHT.BUILD_RECENT_CHANGES';
  const previousScoreByLesson = new Map();
  const scoreChanges = [...scoreRecords]
    .sort((left, right) =>
      compareRecordsChronologically(left, right, getScoreOccurredAt)
    )
    .map((score) => {
      const previousScore = previousScoreByLesson.get(score.LessonId);
      previousScoreByLesson.set(score.LessonId, score);

      return {
        type: 'score',
        occurredAt: getScoreOccurredAt(score),
        lessonId: score.Lesson.id,
        lessonName: score.Lesson.name,
        value: score.value,
        kkm: score.Lesson.KKM,
        previousValue: previousScore ? previousScore.value : null,
        direction: getScoreDirection(previousScore, score),
        recordId: score.id,
      };
    });

  const attendanceChanges = attendanceRecords.map((attendance) => ({
    type: 'attendance',
    occurredAt: getAttendanceOccurredAt(attendance),
    status: attendance.status,
    recordId: attendance.id,
  }));
  const feedbackChanges = feedbackRecords.map((feedback) => ({
    type: 'feedback',
    occurredAt: feedback.observedAt,
    content: feedback.content,
    recordId: feedback.id,
  }));

  return [...scoreChanges, ...attendanceChanges, ...feedbackChanges]
    .filter((change) => !isNil(change.occurredAt))
    .sort((left, right) => {
      const timeDifference =
        getTimestamp(right.occurredAt) - getTimestamp(left.occurredAt);
      if (timeDifference !== 0) return timeDifference;
      return Number(right.recordId || 0) - Number(left.recordId || 0);
    })
    .slice(0, 6)
    .map(({ recordId, ...change }) => change);
}

function getStudentSummary(student) {
  return {
    id: student.id,
    name: student.name,
    nim: student.NIM,
    photo: student.imgUrl,
  };
}

function composeStudentInsights({
  student,
  attendanceRecords,
  scoreRecords,
  feedbackRecords,
  requestedAt,
}) {
  void 'ISSA:SERVER.STUDENT_INSIGHT.COMPOSE_STUDENT';
  const attendance = calculateAttendanceInsight(attendanceRecords, requestedAt);
  const academics = calculateAcademicInsight(scoreRecords);
  const feedback = calculateFeedbackInsight(feedbackRecords, requestedAt);

  return {
    student: getStudentSummary(student),
    attendance: attendance.insight,
    academics: academics.insight,
    feedback: feedback.insight,
    recentChanges: buildRecentChanges(
      attendanceRecords,
      scoreRecords,
      feedbackRecords
    ),
    attentionFlags: [
      ...(attendance.flag ? [attendance.flag] : []),
      ...academics.flags,
      ...(feedback.flag ? [feedback.flag] : []),
    ],
  };
}

function groupRecordsByStudent(records) {
  return groupBy(records, (record) => String(record.StudentId));
}

function getLatestRecordAt(insightSource) {
  const occurredAtValues = [
    ...insightSource.attendanceRecords.map(getAttendanceOccurredAt),
    ...insightSource.scoreRecords.map(getScoreOccurredAt),
    ...insightSource.feedbackRecords.map((feedback) => feedback.observedAt),
  ].filter((occurredAt) => !isNil(occurredAt));

  if (occurredAtValues.length === 0) return null;
  return occurredAtValues.sort(
    (left, right) => getTimestamp(right) - getTimestamp(left)
  )[0];
}

function getAttentionPriority(flags) {
  const flagTypes = new Set(flags.map((flag) => flag.type));
  const hasAcademicAttention = flagTypes.has('academic_attention');
  const hasAttendanceAttention = flagTypes.has('attendance_attention');

  if (hasAcademicAttention && hasAttendanceAttention) return 'high';
  if (hasAcademicAttention || hasAttendanceAttention) return 'medium';
  return 'low';
}

function composeTeacherAttentionQueue({
  students,
  attendanceRecords,
  scoreRecords,
  feedbackRecords,
  requestedAt,
}) {
  void 'ISSA:SERVER.STUDENT_INSIGHT.COMPOSE_TEACHER_ATTENTION';
  const attendanceByStudent = groupRecordsByStudent(attendanceRecords);
  const scoresByStudent = groupRecordsByStudent(scoreRecords);
  const feedbackByStudent = groupRecordsByStudent(feedbackRecords);

  return students
    .map((student) => {
      const studentId = String(student.id);
      const insightSource = {
        attendanceRecords: attendanceByStudent[studentId] || [],
        scoreRecords: scoresByStudent[studentId] || [],
        feedbackRecords: feedbackByStudent[studentId] || [],
      };
      const insights = composeStudentInsights({
        student,
        ...insightSource,
        requestedAt,
      });

      return {
        student: insights.student,
        priority: getAttentionPriority(insights.attentionFlags),
        flags: insights.attentionFlags,
        latestRecordAt: getLatestRecordAt(insightSource),
      };
    })
    .filter((queueItem) => queueItem.flags.length > 0)
    .sort((left, right) => {
      const priorityDifference =
        priorityRank[left.priority] - priorityRank[right.priority];
      if (priorityDifference !== 0) return priorityDifference;

      const latestRecordDifference =
        getTimestamp(right.latestRecordAt) - getTimestamp(left.latestRecordAt);
      if (latestRecordDifference !== 0) return latestRecordDifference;
      return left.student.name.localeCompare(right.student.name);
    });
}

function normalizeRecords(records) {
  return records.map(toPlainRecord);
}

async function getStudentInsights({ studentId, requester, requestedAt = new Date() }) {
  const validStudentId = validateStudentId(studentId);
  if (
    !requester ||
    !['parent', 'teacher'].includes(requester.role) ||
    (
      requester.role === 'parent' &&
      validStudentId !== Number(requester.studentId)
    )
  ) {
    throw { name: 'unauthorized' };
  }

  const studentRecord = await studentInsightRepository.findStudentForRequester({
    studentId: validStudentId,
    requesterRole: requester.role,
    requesterClassId: requester.classId,
    requesterStudentId: requester.studentId,
  });
  if (isNil(studentRecord)) throw { name: 'unauthorized' };

  const [attendanceRecords, scoreRecords, feedbackRecords] = await Promise.all([
    studentInsightRepository.findAttendanceRecords([validStudentId]),
    studentInsightRepository.findScoreRecords([validStudentId]),
    studentInsightRepository.findFeedbackRecords([validStudentId]),
  ]);

  return composeStudentInsights({
    student: toPlainRecord(studentRecord),
    attendanceRecords: normalizeRecords(attendanceRecords),
    scoreRecords: normalizeRecords(scoreRecords),
    feedbackRecords: normalizeRecords(feedbackRecords),
    requestedAt,
  });
}

async function getTeacherAttention({ classId, requestedAt = new Date() }) {
  const studentRecords = await studentInsightRepository.findStudentsForTeacher(classId);
  const students = normalizeRecords(studentRecords);
  if (students.length === 0) return [];

  const studentIds = students.map((student) => student.id);
  const [attendanceRecords, scoreRecords, feedbackRecords] = await Promise.all([
    studentInsightRepository.findAttendanceRecords(studentIds),
    studentInsightRepository.findScoreRecords(studentIds),
    studentInsightRepository.findFeedbackRecords(studentIds),
  ]);

  return composeTeacherAttentionQueue({
    students,
    attendanceRecords: normalizeRecords(attendanceRecords),
    scoreRecords: normalizeRecords(scoreRecords),
    feedbackRecords: normalizeRecords(feedbackRecords),
    requestedAt,
  });
}

module.exports = {
  buildRecentChanges,
  calculateAcademicInsight,
  calculateAttendanceInsight,
  composeStudentInsights,
  composeTeacherAttentionQueue,
  getStudentInsights,
  getTeacherAttention,
};
