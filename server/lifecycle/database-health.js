'use strict';

const DATABASE_HEALTH_TIMEOUT_MS = 5000;

function waitForDatabase(authenticationPromise, timeoutMs) {
  let timeout;
  const deadline = new Promise((resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('Database readiness check timed out'));
    }, timeoutMs);
  });

  return Promise.race([authenticationPromise, deadline])
    .finally(() => clearTimeout(timeout));
}

function createDatabaseHealthHandler({
  authenticate,
  timeoutMs = DATABASE_HEALTH_TIMEOUT_MS,
}) {
  if (typeof authenticate !== 'function') {
    throw new TypeError('authenticate must be a function');
  }

  return async function databaseHealthHandler(req, res) {
    try {
      const authenticationPromise = Promise.resolve().then(authenticate);
      await waitForDatabase(authenticationPromise, timeoutMs);
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'degraded', database: 'unavailable' });
    }
  };
}

module.exports = {
  DATABASE_HEALTH_TIMEOUT_MS,
  createDatabaseHealthHandler,
  waitForDatabase,
};
