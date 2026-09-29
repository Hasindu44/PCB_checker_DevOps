const jwt = require('jsonwebtoken');
const { jwtSecret, cookieSecure } = require('./config');

const COOKIE_NAME = 'circuitguard_session';
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function createToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, {
    expiresIn: '7d',
    issuer: 'circuitguard-api',
    audience: 'circuitguard-web',
  });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: SESSION_AGE_MS,
    path: '/',
  };
}

function setSession(res, user) {
  res.cookie(COOKIE_NAME, createToken(user), cookieOptions());
}

function clearSession(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}

function readSession(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret, {
      issuer: 'circuitguard-api',
      audience: 'circuitguard-web',
    });
  } catch {
    return null;
  }
}

module.exports = { setSession, clearSession, readSession };
