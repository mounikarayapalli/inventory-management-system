import request, { setToken, removeToken, setStoredUser, removeStoredUser } from './client';

export const authAPI = {
  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (data && data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  register: async ({ full_name, email, password, role, username }) => {
    const derivedUsername =
      username ||
      (email ? email.split('@')[0] : '') ||
      (full_name ? full_name.replace(/\s+/g, '_').toLowerCase() : 'user');

    const data = await request('/auth/register', {
      method: 'POST',
      body: {
        full_name,
        email,
        username: derivedUsername,
        password,
        role: role || 'stock manager',
      },
    });
    return data;
  },

  getMe: async () => {
    const user = await request('/auth/me', { method: 'GET' });
    if (user) {
      setStoredUser(user);
    }
    return user;
  },

  logout: () => {
    removeToken();
    removeStoredUser();
  },
};

export default authAPI;
