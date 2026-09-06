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

  getMe: async () => {
    const user = await request('/auth/me', { method: 'GET' });
    if (user) {
      setStoredUser(user);
    }
    return user;
  },

  register: async (userData) => {
    return await request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  },

  logout: () => {
    removeToken();
    removeStoredUser();
  },
};

export default authAPI;
