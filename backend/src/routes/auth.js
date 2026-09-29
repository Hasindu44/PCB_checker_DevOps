const { randomUUID } = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const { clearSession, readSession, setSession } = require('../auth');
const { validateCredentials } = require('../validation');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait and try again.' },
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post('/register', authLimiter, async (req, res, next) => {
  const input = validateCredentials(req.body, true);
  if (input.error) return res.status(400).json({ message: input.error });

  try {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [randomUUID(), input.name, input.email, passwordHash]
    );
    setSession(res, rows[0]);
    return res.status(201).json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }
    return next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  const input = validateCredentials(req.body);
  if (input.error) return res.status(400).json({ message: input.error });

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [input.email]
    );
    const user = rows[0];
    const passwordMatches = user && await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    setSession(res, user);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', async (req, res, next) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ message: 'Not signed in.' });

  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [session.sub]);
    if (!rows[0]) {
      clearSession(res);
      return res.status(401).json({ message: 'Account no longer exists.' });
    }
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

module.exports = router;
