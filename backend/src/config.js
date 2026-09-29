require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://circuitguard:circuitguard@localhost:5432/circuitguard',
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-before-production',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  isProduction,
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
};
