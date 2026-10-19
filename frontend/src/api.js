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

export const drcApi = {
  profiles: () => request('/api/drc/profiles'),
  jobs: () => request('/api/drc/jobs'),
  validate: async (file, profileId) => {
    const form = new FormData();
    form.append('file', file);
    form.append('profileId', profileId);
    const response = await fetch('/api/drc/validate', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.message || 'The PCB archive could not be processed.');
      error.data = data;
      throw error;
    }
    return data;
  },
};
