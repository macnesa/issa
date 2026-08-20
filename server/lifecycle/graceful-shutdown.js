'use strict';

const HTTP_DRAIN_TIMEOUT_MS = 10000;
const FORCE_EXIT_TIMEOUT_MS = 15000;

function closeNetworkServers({ httpServer, realtimeServer }) {
  return new Promise((resolve, reject) => {
    let settled = false;

    function finish(error) {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve();
    }

    try {
      if (realtimeServer && typeof realtimeServer.close === 'function') {
        // Socket.IO closes its Engine.IO transport and the attached HTTP server.
        realtimeServer.close(finish);
      } else if (httpServer && typeof httpServer.close === 'function') {
        httpServer.close(finish);
      } else {
        finish();
      }
    } catch (error) {
      finish(error);
    }
  });
}

function waitForDrain(closePromise, timeoutMs) {
  let timeout;
  const deadline = new Promise((resolve) => {
    timeout = setTimeout(() => resolve(false), timeoutMs);
  });

  return Promise.race([
    closePromise.then(() => true),
    deadline,
  ]).finally(() => clearTimeout(timeout));
}

function createGracefulShutdown({
  httpServer,
  realtimeServer,
  sequelize,
  clearRealtimeServer = () => {},
  exit = (code) => process.exit(code),
  logger = console,
  drainTimeoutMs = HTTP_DRAIN_TIMEOUT_MS,
  forceExitTimeoutMs = FORCE_EXIT_TIMEOUT_MS,
}) {
  let shutdownPromise;
  let exitRequested = false;

  function requestExit(code) {
    if (exitRequested) return;
    exitRequested = true;
    exit(code);
  }

  return function shutdown(signal = 'shutdown', requestedExitCode = 0) {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      let exitCode = requestedExitCode;
      const forceExitTimer = setTimeout(() => {
        logger.error(`Forced shutdown after ${forceExitTimeoutMs}ms`);
        requestExit(1);
      }, forceExitTimeoutMs);

      try {
        logger.log(`Received ${signal}; shutting down`);

        const closePromise = closeNetworkServers({ httpServer, realtimeServer });
        const drained = await waitForDrain(closePromise, drainTimeoutMs);

        if (!drained) {
          exitCode = 1;
          logger.error(`HTTP shutdown exceeded ${drainTimeoutMs}ms`);
          httpServer?.closeAllConnections?.();
        }
      } catch (error) {
        exitCode = 1;
        logger.error('Failed to close network resources during shutdown');
      }

      try {
        clearRealtimeServer();
      } catch (error) {
        exitCode = 1;
        logger.error('Failed to clear realtime resources during shutdown');
      }

      try {
        await sequelize.close();
      } catch (error) {
        exitCode = 1;
        logger.error('Failed to close the database pool during shutdown');
      }

      clearTimeout(forceExitTimer);

      requestExit(exitCode);
      return exitCode;
    })();

    return shutdownPromise;
  };
}

function installShutdownSignalHandlers({ shutdown, processObject = process }) {
  const handlers = new Map();

  for (const signal of ['SIGTERM', 'SIGINT']) {
    const handler = () => {
      void shutdown(signal);
    };
    handlers.set(signal, handler);
    processObject.on(signal, handler);
  }

  return function removeShutdownSignalHandlers() {
    for (const [signal, handler] of handlers) {
      processObject.removeListener(signal, handler);
    }
  };
}

module.exports = {
  FORCE_EXIT_TIMEOUT_MS,
  HTTP_DRAIN_TIMEOUT_MS,
  closeNetworkServers,
  createGracefulShutdown,
  installShutdownSignalHandlers,
  waitForDrain,
};
