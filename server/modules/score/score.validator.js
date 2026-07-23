function validateScoreValue(scoreValue) {
  void 'ISSA:SERVER.SCORE.VALIDATE_VALUE';
  if (
    !Number.isFinite(scoreValue) ||
    !Number.isInteger(scoreValue) ||
    scoreValue < 0 ||
    scoreValue > 100
  ) {
    throw { name: 'invalidScoreValue' };
  }
}

function validateScoreRecordedAt(recordedAt) {
  if (typeof recordedAt !== 'string' || recordedAt.trim() === '') {
    throw { name: 'invalidRecordedAt' };
  }

  const parsedRecordedAt = new Date(recordedAt);
  if (Number.isNaN(parsedRecordedAt.getTime())) throw { name: 'invalidRecordedAt' };

  return parsedRecordedAt;
}

function getCreateRecordedAt(scorePayload) {
  return typeof scorePayload.recordedAt === 'undefined'
    ? new Date()
    : validateScoreRecordedAt(scorePayload.recordedAt);
}

module.exports = {
  getCreateRecordedAt,
  validateScoreRecordedAt,
  validateScoreValue,
};
