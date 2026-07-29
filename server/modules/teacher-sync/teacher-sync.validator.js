const maximumBatchSize = 50;
const maximumClientMutationIdLength = 128;
const supportedMutationTypes = new Set([
  'attendance.update',
  'journal.create',
]);

function invalidSyncBatch() {
  throw { name: 'invalidSyncBatch' };
}

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value);
}

function validateClientMutationId(clientMutationId) {
  if (typeof clientMutationId !== 'string') invalidSyncBatch();
  const normalizedId = clientMutationId.trim();
  if (
    normalizedId.length === 0 ||
    normalizedId.length > maximumClientMutationIdLength
  ) {
    invalidSyncBatch();
  }
  return normalizedId;
}

function validateSyncBatch(syncPayload) {
  if (!isPlainObject(syncPayload)) invalidSyncBatch();
  const { mutations } = syncPayload;
  if (
    !Array.isArray(mutations) ||
    mutations.length < 1 ||
    mutations.length > maximumBatchSize
  ) {
    invalidSyncBatch();
  }

  return mutations.map((mutation) => {
    if (!isPlainObject(mutation)) invalidSyncBatch();
    return {
      ...mutation,
      clientMutationId: validateClientMutationId(
        mutation.clientMutationId
      ),
    };
  });
}

function validateMutationEnvelope(mutation) {
  if (typeof mutation.type !== 'string' || !mutation.type.trim()) {
    throw {
      syncMutationCode: 'invalid_mutation',
      message: 'Mutation type is required.',
    };
  }
  if (!isPlainObject(mutation.payload)) {
    throw {
      syncMutationCode: 'invalid_mutation',
      message: 'Mutation payload must be an object.',
    };
  }
  if (
    typeof mutation.createdAt !== 'undefined' &&
    (
      typeof mutation.createdAt !== 'string' ||
      !mutation.createdAt.trim() ||
      Number.isNaN(new Date(mutation.createdAt).getTime())
    )
  ) {
    throw {
      syncMutationCode: 'invalid_mutation',
      message: 'Mutation createdAt must be a valid date.',
    };
  }

  return {
    ...mutation,
    type: mutation.type.trim(),
  };
}

module.exports = {
  maximumBatchSize,
  supportedMutationTypes,
  validateMutationEnvelope,
  validateSyncBatch,
};
