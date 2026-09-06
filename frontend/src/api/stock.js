import request from './client';

export const stockAPI = {
  listStock: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/stock${queryString}`, { method: 'GET' });
  },

  listMovements: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/stock/movements${queryString}`, { method: 'GET' });
  },

  getItemStock: (itemId) => request(`/stock/${itemId}`, { method: 'GET' }),
};

export default stockAPI;
