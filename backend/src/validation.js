function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateCredentials({ name, email, password }, requireName = false) {
  const normalizedEmail = normalizeEmail(email);
  const cleanName = String(name || '').trim();

  if (requireName && (cleanName.length < 2 || cleanName.length > 80)) {
    return { error: 'Name must be between 2 and 80 characters.' };
  }
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { error: 'Enter a valid email address.' };
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
    return { error: 'Password must be between 8 and 72 characters.' };
  }

  return { name: cleanName, email: normalizedEmail, password };
}

module.exports = { normalizeEmail, validateCredentials };
