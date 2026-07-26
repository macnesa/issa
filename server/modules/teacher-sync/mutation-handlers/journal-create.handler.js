const studentLearningJournalService = require(
  '../../student-learning-journal/student-learning-journal.service'
);

function hasOwn(value, fieldName) {
  return Object.prototype.hasOwnProperty.call(value, fieldName);
}

function rejectMutation(code, message) {
  throw { syncMutationCode: code, message };
}

function mapJournalError(error) {
  if (error?.name === 'unauthorized') {
    return {
      syncMutationCode: 'student_access_denied',
      message: 'Teacher no longer has access to this student.',
    };
  }
  if (
    error?.name === 'notFound' ||
    String(error?.name || '').startsWith('invalidJournal')
  ) {
    return {
      syncMutationCode: 'journal_validation_failed',
      message: 'Journal mutation payload is invalid.',
    };
  }
  return null;
}

async function applyJournalCreate({
  mutation,
  requester,
  transaction,
}) {
  void 'ISSA:SERVER.TEACHER_SYNC.APPLY_JOURNAL';
  if (hasOwn(mutation.payload, 'evidenceId')) {
    rejectMutation(
      'journal_evidence_not_supported',
      'Offline journal mutations do not support evidence.'
    );
  }

  const { payload } = mutation;
  try {
    const serverRecord = await studentLearningJournalService
      .createJournalEntry({
        studentId: String(payload.studentId),
        requester,
        journalPayload: {
          type: payload.type,
          content: payload.content,
          voiceCaptureType: payload.voiceCaptureType,
          observedAt: payload.observedAt,
        },
        transaction,
        emitRealtime: false,
      });

    return {
      realtimeEvent: {
        studentId: serverRecord.studentId,
        recordType: 'journal',
        occurredAt: serverRecord.observedAt,
      },
      serverRecord,
      status: 'applied',
    };
  } catch (error) {
    const mappedError = mapJournalError(error);
    if (mappedError) throw mappedError;
    throw error;
  }
}

module.exports = {
  applyJournalCreate,
  mapJournalError,
};
