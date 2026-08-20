'use strict';

const canonicalAttendanceStatus = Object.freeze({
  present: 'Hadir',
  absent: 'Alfa',
  excused: 'Izin',
  sick: 'Sakit',
});

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function normalizeReference(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function studentCandidate(student) {
  const plainStudent = toPlainRecord(student);
  return { studentId: plainStudent.id, name: plainStudent.name };
}

function containsTokenSequence(value, reference) {
  const valueTokens = value.split(' ');
  const referenceTokens = reference.split(' ');
  if (referenceTokens.length > valueTokens.length) return false;

  return valueTokens.some((token, index) => (
    token === referenceTokens[0] &&
    valueTokens.slice(index, index + referenceTokens.length).join(' ') ===
      reference
  ));
}

function resolveStudentReference(studentReference, roster) {
  const reference = normalizeReference(studentReference);
  const students = roster.map(toPlainRecord);
  const exactMatches = students.filter(
    (student) => normalizeReference(student.name) === reference
  );
  const partialMatches = students.filter((student) => {
    const name = normalizeReference(student.name);
    return containsTokenSequence(name, reference);
  });
  const matches = exactMatches.length > 0 ? exactMatches : partialMatches;

  if (matches.length === 1) {
    return {
      status: 'resolved',
      student: studentCandidate(matches[0]),
      candidates: [],
    };
  }
  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      student: null,
      candidates: matches.map(studentCandidate),
    };
  }
  return { status: 'unresolved', student: null, candidates: [] };
}

function assignmentCandidate(assignment) {
  const plainAssignment = toPlainRecord(assignment);
  return {
    assignmentId: plainAssignment.id,
    name: plainAssignment.name,
    type: plainAssignment.type || null,
  };
}

function resolveAssessmentReference(assessmentReference, assignments) {
  const candidates = assignments.map(toPlainRecord);
  if (!assessmentReference) {
    return {
      status: 'unresolved',
      assignment: null,
      candidates: candidates.map(assignmentCandidate),
    };
  }

  const reference = normalizeReference(assessmentReference);
  const exactMatches = candidates.filter(
    (assignment) => normalizeReference(assignment.name) === reference
  );
  const partialMatches = candidates.filter((assignment) => {
    const searchableText = normalizeReference([
      assignment.name,
      assignment.type,
      assignment.desc,
    ].filter(Boolean).join(' '));
    return searchableText.includes(reference);
  });
  const matches = exactMatches.length > 0 ? exactMatches : partialMatches;

  if (matches.length === 1) {
    return {
      status: 'resolved',
      assignment: assignmentCandidate(matches[0]),
      candidates: [],
    };
  }
  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      assignment: null,
      candidates: matches.map(assignmentCandidate),
    };
  }
  return { status: 'unresolved', assignment: null, candidates: [] };
}

function studentClarificationReason(resolution) {
  if (resolution.status === 'ambiguous') return 'student_ambiguous';
  if (resolution.status === 'unresolved') return 'student_unresolved';
  return null;
}

function buildResolvedDraft({ item, index, roster, assignments, context }) {
  const studentResolution = resolveStudentReference(
    item.studentReference,
    roster
  );
  const clarificationReasons = [];
  const studentReason = studentClarificationReason(studentResolution);
  if (studentReason) clarificationReasons.push(studentReason);

  let payload;
  let assessmentResolution;
  if (item.type === 'feedback') {
    payload = { feedback: item.payload.observation };
    if (item.payload.domainAmbiguous) {
      clarificationReasons.push('feedback_journal_boundary_ambiguous');
    }
  } else if (item.type === 'journal') {
    payload = {
      type: item.payload.entryType,
      content: item.payload.content,
      voiceCaptureType: item.payload.entryType === 'student_reflection'
        ? 'paraphrased'
        : null,
      evidenceId: null,
    };
    if (item.payload.domainAmbiguous) {
      clarificationReasons.push('feedback_journal_boundary_ambiguous');
    }
  } else if (item.type === 'attendance') {
    const mappedStatus = canonicalAttendanceStatus[item.payload.status] || null;
    payload = {
      reportedStatus: item.payload.status,
      status: mappedStatus,
      minutesLate: item.payload.minutesLate,
      attendanceDate: null,
    };
    if (!mappedStatus) {
      clarificationReasons.push('attendance_status_not_supported');
    }
  } else {
    assessmentResolution = resolveAssessmentReference(
      item.payload.assessmentReference,
      assignments
    );
    payload = {
      value: item.payload.score,
      assessmentReference: item.payload.assessmentReference,
      LessonId: context.lesson?.id || null,
      AssignmentId: assessmentResolution.assignment?.assignmentId || null,
    };
    if (!context.lesson) clarificationReasons.push('lesson_required');
    if (assessmentResolution.status === 'ambiguous') {
      clarificationReasons.push('assessment_ambiguous');
    } else if (assessmentResolution.status === 'unresolved') {
      clarificationReasons.push('assessment_unresolved');
    }
  }

  return {
    draftId: `debrief-draft-${index + 1}`,
    type: item.type,
    state: clarificationReasons.length === 0
      ? 'ready'
      : 'needs_clarification',
    sourceExcerpt: item.sourceExcerpt,
    studentReference: item.studentReference,
    studentResolution,
    payload,
    clarificationReasons,
    context: {
      class: context.class,
      lesson: context.lesson,
      assessmentResolution: assessmentResolution || null,
    },
  };
}

function resolveDrafts({ items, roster, assignments, context }) {
  return items.map((item, index) => buildResolvedDraft({
    item,
    index,
    roster,
    assignments,
    context,
  }));
}

module.exports = {
  buildResolvedDraft,
  normalizeReference,
  resolveAssessmentReference,
  resolveDrafts,
  resolveStudentReference,
};
