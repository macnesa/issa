const { sequelize } = require('../../models');
const {
  emitStudentRecordUpdated,
} = require('../../realtime/student-record-events');
const {
  applyAttendanceUpdate,
} = require('./mutation-handlers/attendance-update.handler');
const {
  applyJournalCreate,
} = require('./mutation-handlers/journal-create.handler');
const { hashMutationRequest } = require('./teacher-sync.hash');
const teacherSyncRepository = require('./teacher-sync.repository');
const {
  supportedMutationTypes,
  validateMutationEnvelope,
  validateSyncBatch,
} = require('./teacher-sync.validator');

const mutationHandlers = {
  'attendance.update': applyAttendanceUpdate,
  'journal.create': applyJournalCreate,
};

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function buildMutationResult({
  clientMutationId,
  status,
  serverRecord = null,
  conflict = null,
  error = null,
}) {
  return {
    clientMutationId,
    status,
    serverRecord,
    conflict,
    error,
  };
}

function rejectedResult(clientMutationId, code, message) {
  return buildMutationResult({
    clientMutationId,
    status: 'rejected',
    error: { code, message },
  });
}

function resolveReceiptResult({
  receiptRecord,
  requestHash,
  clientMutationId,
  mutationType,
}) {
  void 'ISSA:SERVER.TEACHER_SYNC.RESOLVE_DUPLICATE';
  const receipt = toPlainRecord(receiptRecord);
  if (
    receipt.requestHash !== requestHash ||
    receipt.mutationType !== mutationType
  ) {
    return rejectedResult(
      clientMutationId,
      'idempotency_key_reused',
      'Mutation identifier has already been used with different data.'
    );
  }

  return buildMutationResult({
    clientMutationId,
    status: 'duplicate',
    serverRecord: receipt.result?.serverRecord || null,
  });
}

async function processMutation({ requester, mutation }) {
  const { clientMutationId } = mutation;
  const requestHash = hashMutationRequest(mutation);

  const transactionOutcome = await sequelize.transaction(
    async (transaction) => {
      const teacher = await teacherSyncRepository.lockTeacher(
        requester.teacherId,
        transaction
      );
      if (!teacher) throw { name: 'unAuthentication' };

      const receipt = await teacherSyncRepository.findReceipt({
        teacherId: requester.teacherId,
        clientMutationId,
        transaction,
      });
      if (receipt) {
        return {
          realtimeEvent: null,
          result: resolveReceiptResult({
            receiptRecord: receipt,
            requestHash,
            clientMutationId,
            mutationType: mutation.type,
          }),
        };
      }

      let validMutation;
      try {
        validMutation = validateMutationEnvelope(mutation);
      } catch (error) {
        if (!error?.syncMutationCode) throw error;
        return {
          realtimeEvent: null,
          result: rejectedResult(
            clientMutationId,
            error.syncMutationCode,
            error.message
          ),
        };
      }

      if (!supportedMutationTypes.has(validMutation.type)) {
        return {
          realtimeEvent: null,
          result: rejectedResult(
            clientMutationId,
            'unsupported_mutation_type',
            'Mutation type is not supported.'
          ),
        };
      }

      let handlerResult;
      try {
        handlerResult = await mutationHandlers[validMutation.type]({
          mutation: validMutation,
          requester,
          transaction,
        });
      } catch (error) {
        if (!error?.syncMutationCode) throw error;
        return {
          realtimeEvent: null,
          result: rejectedResult(
            clientMutationId,
            error.syncMutationCode,
            error.message || 'Mutation was rejected.'
          ),
        };
      }

      if (handlerResult.status === 'conflict') {
        return {
          realtimeEvent: null,
          result: buildMutationResult({
            clientMutationId,
            status: 'conflict',
            conflict: handlerResult.conflict,
            error: {
              code: 'attendance_version_conflict',
              message: 'Attendance changed on the server.',
            },
          }),
        };
      }

      const receiptResult = {
        serverRecord: handlerResult.serverRecord,
      };
      await teacherSyncRepository.createReceipt({
        TeacherId: requester.teacherId,
        clientMutationId,
        mutationType: validMutation.type,
        requestHash,
        status: 'applied',
        result: receiptResult,
        processedAt: new Date(),
      }, transaction);

      return {
        realtimeEvent: handlerResult.realtimeEvent,
        result: buildMutationResult({
          clientMutationId,
          status: 'applied',
          serverRecord: handlerResult.serverRecord,
        }),
      };
    }
  );

  if (transactionOutcome.realtimeEvent) {
    emitStudentRecordUpdated(transactionOutcome.realtimeEvent);
  }

  return transactionOutcome.result;
}

async function processTeacherSyncBatch({ requester, syncPayload }) {
  void 'ISSA:SERVER.TEACHER_SYNC.PROCESS_BATCH';
  const mutations = validateSyncBatch(syncPayload);
  const results = [];

  for (const mutation of mutations) {
    results.push(await processMutation({ requester, mutation }));
  }

  return { results };
}

module.exports = {
  buildMutationResult,
  processMutation,
  processTeacherSyncBatch,
  resolveReceiptResult,
};
