import request from './client';

export const itemsAPI = {
  listItems: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') query.append('is_active', params.is_active);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/items${queryString}`, { method: 'GET' });
  },

  getItemById: (id) => request(`/items/${id}`, { method: 'GET' }),

  createItem: (payload) => request('/items', { method: 'POST', body: payload }),

  updateItem: (id, payload) => request(`/items/${id}`, { method: 'PATCH', body: payload }),
};

export default itemsAPI;
