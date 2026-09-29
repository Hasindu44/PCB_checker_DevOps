async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'The server could not complete the request.');
  }
  return data;
}

export const authApi = {
  currentUser: () => request('/api/auth/me'),
  login: (credentials) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (details) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};
