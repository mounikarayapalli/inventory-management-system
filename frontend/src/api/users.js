import request from './client';

export const usersAPI = {
  listUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.role_id !== undefined && params.role_id !== null && params.role_id !== '') query.append('role_id', params.role_id);
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') query.append('is_active', params.is_active);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/users${queryString}`, { method: 'GET' });
  },

  getUserById: (id) => request(`/users/${id}`, { method: 'GET' }),

  createUser: (payload) => request('/users', { method: 'POST', body: payload }),

  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PATCH', body: payload }),
};

export default usersAPI;
