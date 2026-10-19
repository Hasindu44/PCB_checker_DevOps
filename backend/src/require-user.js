const { pool } = require('./db');
const { readSession } = require('./auth');

async function requireUser(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ message: 'Sign in to access this resource.' });

  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [session.sub]);
    if (!rows[0]) return res.status(401).json({ message: 'Your account is no longer available.' });
    req.user = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireUser };
