// Centralized API Client for Calibo AI Academy Inventory Backend

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class APIError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.detail = detail;
  }
}

export const getToken = () => localStorage.getItem('access_token');
export const setToken = (token) => localStorage.setItem('access_token', token);
export const removeToken = () => localStorage.removeItem('access_token');

export const getStoredUser = () => {
  try {
    const u = localStorage.getItem('auth_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('auth_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('auth_user');

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Clear token on unauthorized session expiry
      removeToken();
      removeStoredUser();
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      let errorMsg =
        data?.error?.message ||
        (Array.isArray(data?.detail)
          ? data.detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ')
          : data?.detail) ||
        data?.message ||
        `Request failed with status ${response.status}`;

      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }

      throw new APIError(
        errorMsg,
        response.status,
        data
      );
    }

    return data;
  } catch (err) {
    if (err instanceof APIError) {
      throw err;
    }
    throw new APIError(err.message || 'Network request failed', 0, null);
  }
}

export default request;
