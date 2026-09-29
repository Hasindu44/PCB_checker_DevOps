const app = require('./app');
const { pool, initializeDatabase } = require('./db');
const { port, isProduction, jwtSecret } = require('./config');

async function start() {
  if (isProduction && jwtSecret === 'local-development-secret-change-before-production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  await initializeDatabase();
  const server = app.listen(port, () => console.log(`CircuitGuard API listening on port ${port}`));

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down.`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('API startup failed:', error);
  process.exit(1);
});
