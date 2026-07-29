const SEARCH_QUERY_MIN_LENGTH = 2;
const SEARCH_QUERY_MAX_LENGTH = 80;
const SEARCH_LIMIT_DEFAULT = 5;
const SEARCH_LIMIT_MAX = 5;

function invalidSearchQuery() {
  throw { name: 'invalid_search_query' };
}

function validateTeacherSearchQuery(queryParameters = {}) {
  const rawQuery = queryParameters.q;
  if (typeof rawQuery !== 'string') invalidSearchQuery();

  const query = rawQuery.trim();
  if (
    query.length < SEARCH_QUERY_MIN_LENGTH
    || query.length > SEARCH_QUERY_MAX_LENGTH
  ) {
    invalidSearchQuery();
  }

  const rawLimit = queryParameters.limit;
  if (typeof rawLimit === 'undefined' || rawLimit === '') {
    return { query, limit: SEARCH_LIMIT_DEFAULT };
  }
  if (
    typeof rawLimit !== 'string'
    || !/^\d+$/.test(rawLimit)
  ) {
    invalidSearchQuery();
  }

  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > SEARCH_LIMIT_MAX) {
    invalidSearchQuery();
  }

  return { query, limit };
}

module.exports = {
  validateTeacherSearchQuery,
};
