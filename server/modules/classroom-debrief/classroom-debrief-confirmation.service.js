'use strict';

const { sequelize } = require('../../models');
const {
  emitStudentRecordUpdated,
} = require('../../realtime/student-record-events');
const attendanceService = require('../attendance/attendance.service');
const feedbackService = require('../feedback/feedback.service');
const scoreService = require('../score/score.service');
const journalService = require(
  '../student-learning-journal/student-learning-journal.service'
);
const { hashMutationRequest } = require('../teacher-sync/teacher-sync.hash');
const receiptRepository = require('../teacher-sync/teacher-sync.repository');
const classroomDebriefRepository = require('./classroom-debrief.repository');
const {
  classroomDebriefError,
} = require('./classroom-debrief.contract');
const {
  validateConfirmationItem,
  validateConfirmationRequest,
} = require('./classroom-debrief-confirmation.validator');

const confirmationMutationPrefix = 'classroom-debrief.';
const historySource = 'classroom_debrief';

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function failedResult(item, code) {
  return {
    clientMutationId: typeof item?.clientMutationId === 'string'
      ? item.clientMutationId.trim()
      : null,
    code,
    draftId: typeof item?.draftId === 'string' ? item.draftId.trim() : null,
    recordType: typeof item?.recordType === 'string'
      ? item.recordType
      : null,
    status: 'failed',
  };
}

function safeFailureCode(error) {
  const codes = {
    attendanceAlreadyExists: 'record_already_exists',
    classroom_debrief_assignment_not_found: 'assessment_not_found',
    classroom_debrief_context_not_found: 'lesson_not_found',
    classroom_debrief_student_not_found: 'student_not_found',
    duplicateScore: 'record_already_exists',
    invalidAttendanceDate: 'invalid_attendance_date',
    invalidAttendanceStatus: 'invalid_attendance_status',
    invalidFeedback: 'invalid_feedback',
    feedbackTooLong: 'invalid_feedback',
    invalidJournalContent: 'invalid_journal',
    invalidJournalObservedAt: 'invalid_journal',
    invalidJournalType: 'invalid_journal',
    invalidJournalVoiceCaptureType: 'invalid_journal',
    invalidObservedAt: 'invalid_feedback_date',
    invalidRecordedAt: 'invalid_score_date',
    invalidScoreValue: 'invalid_score',
    notFound: 'record_context_not_found',
    unauthorized: 'student_access_denied',
  };
  return codes[error?.name] || 'confirmation_failed';
}

async function requireItemContext({ item, requester, repository, transaction }) {
  const options = { transaction };
  const teacherClass = await repository.findTeacherClass({
    teacherId: requester.teacherId,
    classId: requester.classId,
  }, options);
  if (!teacherClass) {
    throw classroomDebriefError('classroom_debrief_access_denied');
  }

  const student = await repository.findStudentInClass({
    studentId: item.studentId,
    classId: requester.classId,
  }, options);
  if (!student) {
    throw classroomDebriefError('classroom_debrief_student_not_found');
  }

  if (item.recordType !== 'score') return;

  const lesson = await repository.findLessonForClass({
    lessonId: item.payload.lessonId,
    classId: requester.classId,
  }, options);
  if (!lesson) {
    throw classroomDebriefError('classroom_debrief_context_not_found');
  }

  const assignment = await repository.findAssignmentForClassLesson({
    assignmentId: item.payload.assignmentId,
    classId: requester.classId,
    lessonId: item.payload.lessonId,
  }, options);
  if (!assignment) {
    throw classroomDebriefError('classroom_debrief_assignment_not_found');
  }
}

async function commitCanonicalRecord({
  item,
  requester,
  transaction,
  services,
}) {
  if (item.recordType === 'attendance') {
    const record = await services.attendance.createAttendanceRecord({
      classId: requester.classId,
      attendancePayload: {
        StudentId: item.studentId,
        attendanceDate: item.payload.attendanceDate,
        status: item.payload.status,
      },
      transaction,
      emitRealtime: false,
      historySource,
    });
    return {
      occurredAt: item.payload.attendanceDate,
      recordId: toPlainRecord(record)?.id,
    };
  }

  if (item.recordType === 'score') {
    const result = await services.score.createStudentScore({
      classId: requester.classId,
      scorePayload: {
        AssignmentId: item.payload.assignmentId,
        LessonId: item.payload.lessonId,
        StudentId: item.studentId,
        desc: item.payload.description,
        recordedAt: item.payload.recordedAt,
        value: item.payload.value,
      },
      transaction,
      emitRealtime: false,
      historySource,
    });
    const scoreRecord = toPlainRecord(result.data);
    return {
      occurredAt: scoreRecord?.recordedAt || item.payload.recordedAt,
      recordId: scoreRecord?.id,
    };
  }

  if (item.recordType === 'feedback') {
    const result = await services.feedback.updateStudentFeedback({
      studentId: item.studentId,
      classId: requester.classId,
      teacherId: requester.teacherId,
      studentUpdatePayload: {
        feedback: item.payload.content,
        observedAt: item.payload.observedAt,
      },
      transaction,
      emitRealtime: false,
      historySource,
    });
    return {
      emitRealtime: result.feedbackChanged,
      occurredAt: result.occurredAt,
      recordId: toPlainRecord(result.feedbackRecord)?.id ||
        toPlainRecord(result.data)?.id,
    };
  }

  const record = await services.journal.createJournalEntry({
    studentId: String(item.studentId),
    requester,
    journalPayload: {
      content: item.payload.content,
      evidenceId: null,
      observedAt: item.payload.observedAt,
      type: item.payload.type,
      voiceCaptureType: item.payload.voiceCaptureType,
    },
    transaction,
    emitRealtime: false,
  });
  return {
    occurredAt: record.observedAt,
    recordId: record.id,
  };
}

function createClassroomDebriefConfirmationService({
  database = sequelize,
  repository = classroomDebriefRepository,
  receipts = receiptRepository,
  services = {
    attendance: attendanceService,
    feedback: feedbackService,
    journal: journalService,
    score: scoreService,
  },
  emitRealtime = emitStudentRecordUpdated,
  clock = () => new Date(),
} = {}) {
  async function processItem({ requester, rawItem }) {
    let item;
    try {
      item = validateConfirmationItem(rawItem);
    } catch (error) {
      return failedResult(rawItem, 'invalid_draft');
    }

    const mutationType = `${confirmationMutationPrefix}${item.recordType}`;
    const requestHash = hashMutationRequest({
      type: mutationType,
      payload: item,
    });

    try {
      const outcome = await database.transaction(async (transaction) => {
        const teacher = await receipts.lockTeacher(
          requester.teacherId,
          transaction
        );
        if (!teacher) throw { name: 'unAuthentication' };

        const receipt = await receipts.findReceipt({
          teacherId: requester.teacherId,
          clientMutationId: item.clientMutationId,
          transaction,
        });
        if (receipt) {
          const storedReceipt = toPlainRecord(receipt);
          if (
            storedReceipt.requestHash !== requestHash ||
            storedReceipt.mutationType !== mutationType
          ) {
            return {
              realtimeEvent: null,
              result: failedResult(item, 'idempotency_key_reused'),
            };
          }
          return {
            realtimeEvent: null,
            result: {
              ...storedReceipt.result.serverRecord,
              status: 'duplicate',
            },
          };
        }

        await requireItemContext({
          item,
          requester,
          repository,
          transaction,
        });
        const canonicalRecord = await commitCanonicalRecord({
          item,
          requester,
          transaction,
          services,
        });
        const result = {
          clientMutationId: item.clientMutationId,
          draftId: item.draftId,
          recordId: canonicalRecord.recordId || null,
          recordType: item.recordType,
          status: 'committed',
        };
        await receipts.createReceipt({
          TeacherId: requester.teacherId,
          clientMutationId: item.clientMutationId,
          mutationType,
          processedAt: clock(),
          requestHash,
          result: { serverRecord: result },
          status: 'applied',
        }, transaction);

        return {
          realtimeEvent: canonicalRecord.emitRealtime === false
            ? null
            : {
              occurredAt: canonicalRecord.occurredAt,
              recordType: item.recordType,
              studentId: item.studentId,
            },
          result,
        };
      });

      if (outcome.realtimeEvent) emitRealtime(outcome.realtimeEvent);
      return outcome.result;
    } catch (error) {
      return failedResult(item, safeFailureCode(error));
    }
  }

  async function confirmDrafts({ requester, requestBody }) {
    void 'ISSA:SERVER.CLASSROOM_DEBRIEF.CONFIRM_DRAFTS';
    if (!requester || requester.role !== 'teacher') {
      throw { name: 'unAuthentication' };
    }
    if (requester.isDemo || requester.accessMode === 'demo') {
      throw { name: 'publicDemoReadOnly' };
    }

    const items = validateConfirmationRequest(requestBody);
    const results = [];
    for (const rawItem of items) {
      results.push(await processItem({ requester, rawItem }));
    }
    return { results };
  }

  return { confirmDrafts, processItem };
}

module.exports = createClassroomDebriefConfirmationService();
module.exports.createClassroomDebriefConfirmationService =
  createClassroomDebriefConfirmationService;
module.exports.safeFailureCode = safeFailureCode;
