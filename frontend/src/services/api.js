const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Dashboard
  async getDashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    return handleResponse(res);
  },

  // Projects
  async getProjects(status = '', search = '') {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/projects${queryString}`);
    return handleResponse(res);
  },

  async getProjectById(id) {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleResponse(res);
  },

  async createProject(projectData) {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  // DRC Results
  async getDrcResults(status = '') {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/drc-results${queryString}`);
    return handleResponse(res);
  },

  async getDrcResultById(id) {
    const res = await fetch(`${API_BASE_URL}/drc-results/${id}`);
    return handleResponse(res);
  },

  // Reviews / File Processing
  async createReview(reviewData) {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return handleResponse(res);
  },

  async uploadReviewFiles(formData) {
    const res = await fetch(`${API_BASE_URL}/reviews/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Activity
  async getActivities() {
    const res = await fetch(`${API_BASE_URL}/activity`);
    return handleResponse(res);
  },

  // Auth
  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE_URL}/users/me`);
    return handleResponse(res);
  },
};
