const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db');
const { frontendOrigin, isProduction } = require('./config');
const authRoutes = require('./routes/auth');

const app = express();

if (isProduction) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});
app.use('/api/auth', authRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'The server could not complete the request.' });
});

module.exports = app;
