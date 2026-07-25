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
const { initializeRealtimeServer } = require('./realtime/realtime-server');

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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use('/', router);
app.use(errorHandler);

function startServer() {
  const httpServer = http.createServer(app);
  initializeRealtimeServer(httpServer, { allowedOrigins });

  return httpServer.listen(port, '0.0.0.0', () => {
    console.log(`ISSA demo server listening on port ${port}`);
  });
}

if (require.main === module) startServer();

module.exports = app;
module.exports.startServer = startServer;
