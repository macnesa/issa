const {
  SyncMutationReceipt,
  Teacher,
} = require('../../models');

function lockTeacher(teacherId, transaction) {
  return Teacher.findByPk(teacherId, {
    attributes: ['id'],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
}

function findReceipt({
  teacherId,
  clientMutationId,
  transaction = null,
}) {
  const queryOptions = {
    where: {
      TeacherId: teacherId,
      clientMutationId,
    },
  };
  if (transaction) queryOptions.transaction = transaction;
  return SyncMutationReceipt.findOne(queryOptions);
}

function createReceipt(receiptPayload, transaction) {
  return SyncMutationReceipt.create(receiptPayload, { transaction });
}

module.exports = {
  createReceipt,
  findReceipt,
  lockTeacher,
};
