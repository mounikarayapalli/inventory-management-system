import request from './client';

export const categoriesAPI = {
  listCategories: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') query.append('is_active', params.is_active);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/categories${queryString}`, { method: 'GET' });
  },

  getCategoryById: (id) => request(`/categories/${id}`, { method: 'GET' }),

  createCategory: (payload) => request('/categories', { method: 'POST', body: payload }),

  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PATCH', body: payload }),
};

export default categoriesAPI;
