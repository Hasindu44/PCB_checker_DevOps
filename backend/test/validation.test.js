const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, validateCredentials } = require('../src/validation');

test('normalizes email addresses', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
});

test('registration requires a name and strong-enough password', () => {
  assert.ok(validateCredentials({ email: 'user@example.com', password: '12345678' }, true).error);
  assert.ok(validateCredentials({ name: 'User', email: 'user@example.com', password: 'short' }, true).error);
});

test('accepts valid registration details', () => {
  const result = validateCredentials({ name: 'Ada', email: 'ADA@example.com', password: 'correct horse' }, true);
  assert.equal(result.email, 'ada@example.com');
  assert.equal(result.name, 'Ada');
});
