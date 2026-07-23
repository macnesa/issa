function validateObservedAt(observedAt) {
  void 'ISSA:SERVER.FEEDBACK.VALIDATE_OBSERVED_AT';
  if (typeof observedAt !== 'string' || !observedAt.trim()) throw { name: 'invalidObservedAt' };

  const observedAtInput = observedAt.trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDate.test(observedAtInput) && !isoDateTime.test(observedAtInput)) {
    throw { name: 'invalidObservedAt' };
  }

  const parsedObservedAt = new Date(observedAtInput);
  if (Number.isNaN(parsedObservedAt.getTime())) throw { name: 'invalidObservedAt' };

  if (isoDate.test(observedAtInput)) {
    const [year, month, day] = observedAtInput.split('-').map(Number);
    if (
      parsedObservedAt.getUTCFullYear() !== year ||
      parsedObservedAt.getUTCMonth() + 1 !== month ||
      parsedObservedAt.getUTCDate() !== day
    ) {
      throw { name: 'invalidObservedAt' };
    }
  }

  return parsedObservedAt;
}

function validateFeedbackUpdate(studentUpdatePayload) {
  const hasFeedback = Object.prototype.hasOwnProperty.call(studentUpdatePayload, 'feedback');
  if (!hasFeedback) return { hasFeedback: false };

  const feedback = typeof studentUpdatePayload.feedback === 'string'
    ? studentUpdatePayload.feedback.trim()
    : '';
  if (!feedback) throw { name: 'invalidFeedback' };

  const observedAt = Object.prototype.hasOwnProperty.call(studentUpdatePayload, 'observedAt')
    ? validateObservedAt(studentUpdatePayload.observedAt)
    : new Date();

  return { hasFeedback, feedback, observedAt };
}

module.exports = {
  validateFeedbackUpdate,
  validateObservedAt,
};
