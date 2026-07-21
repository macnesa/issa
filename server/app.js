if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// console.log(process.env.JWT_SECRET, 'nihh');

const { errorHandler } = require('./middlewares/errorHandler');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const router = require('./routes');

const { createServer } = require('http');
const { connIOServer } = require('./middlewares/socketio');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use('/', router);

const httpServer = createServer(app);

connIOServer(httpServer);

httpServer.listen(port, () => {
  console.log(
    `
==========================================
 🚀  ISSA SERVER launch on port ${port}  🚀
==========================================
    `
  );
});

app.use(errorHandler);

module.exports = app;
