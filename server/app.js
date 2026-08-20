if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

function parseFrontendOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      const parsedOrigin = new URL(origin);
      if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin.replace(/\/$/, '')) {
        throw new Error('FRONTEND_ORIGINS must contain comma-separated HTTP(S) origins without paths.');
      }
      return parsedOrigin.origin;
    });
}

function assertProductionEnvironment() {
  const { getPublicDemoConfig } = require('./config/public-demo');
  getPublicDemoConfig();

  if (process.env.NODE_ENV !== 'production') return;

  const requiredVariables = ['DATABASE_URL', 'FRONTEND_ORIGINS', 'JWT_SECRET'];
  const missingVariables = requiredVariables.filter((variableName) => !String(process.env[variableName] || '').trim());
  if (missingVariables.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}.`);
  }

  parseFrontendOrigins(process.env.FRONTEND_ORIGINS);
}

assertProductionEnvironment();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { sequelize } = require('./models');
const router = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const {
  createPublicDemoAccessGuard,
} = require('./middlewares/public-demo-access');
const { initializeRealtimeServer } = require('./realtime/realtime-server');
const { setRealtimeServer } = require('./realtime/student-record-events');
const {
  createDatabaseHealthHandler,
} = require('./lifecycle/database-health');
const {
  createGracefulShutdown,
  installShutdownSignalHandlers,
} = require('./lifecycle/graceful-shutdown');

const app = express();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

function configuredOrigins() {
  if (process.env.NODE_ENV === 'production') {
    return parseFrontendOrigins(process.env.FRONTEND_ORIGINS);
  }

  return ['http://localhost:3001', 'http://localhost:3100'];
}

const allowedOrigins = configuredOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(createPublicDemoAccessGuard());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/health', createDatabaseHealthHandler({
  authenticate: () => sequelize.authenticate(),
}));

app.use('/', router);
app.use(errorHandler);

function createApplicationServer() {
  const httpServer = http.createServer(app);
  const realtimeServer = initializeRealtimeServer(httpServer, { allowedOrigins });

  return { httpServer, realtimeServer };
}

function startServer({
  manageProcessLifecycle = require.main === module,
  exit = (code) => process.exit(code),
} = {}) {
  const { httpServer, realtimeServer } = createApplicationServer();

  if (manageProcessLifecycle) {
    const shutdown = createGracefulShutdown({
      httpServer,
      realtimeServer,
      sequelize,
      clearRealtimeServer: () => setRealtimeServer(null),
      exit,
    });

    installShutdownSignalHandlers({ shutdown });
    httpServer.on('error', (error) => {
      console.error('ISSA HTTP server error', error);
      void shutdown('HTTP_SERVER_ERROR', 1);
    });
  }

  return httpServer.listen(port, '0.0.0.0', () => {
    console.log(`ISSA demo server listening on port ${port}`);
  });
}

if (require.main === module) startServer();

module.exports = app;
module.exports.createApplicationServer = createApplicationServer;
module.exports.startServer = startServer;
