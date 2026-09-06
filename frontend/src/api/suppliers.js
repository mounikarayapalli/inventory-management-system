import request from './client';

export const suppliersAPI = {
  listSuppliers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') query.append('is_active', params.is_active);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/suppliers${queryString}`, { method: 'GET' });
  },

  getSupplierById: (id) => request(`/suppliers/${id}`, { method: 'GET' }),

  createSupplier: (payload) => request('/suppliers', { method: 'POST', body: payload }),

  updateSupplier: (id, payload) => request(`/suppliers/${id}`, { method: 'PATCH', body: payload }),
};

export default suppliersAPI;
