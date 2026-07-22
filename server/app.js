if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const router = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const port = Number(process.env.PORT || 3000);

function configuredOrigins() {
  if (process.env.NODE_ENV === 'production') {
    return (process.env.FRONTEND_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
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
  return app.listen(port, () => {
    console.log(`ISSA demo server listening on port ${port}`);
  });
}

if (require.main === module) startServer();

module.exports = app;
module.exports.startServer = startServer;
