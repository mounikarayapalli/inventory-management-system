import request from './client';

export const transactionsAPI = {
  createOpeningStock: (payload) => request('/transactions/opening-stock', { method: 'POST', body: payload }),

  createInward: (payload) => request('/transactions/inward', { method: 'POST', body: payload }),

  createOutward: (payload) => request('/transactions/outward', { method: 'POST', body: payload }),

  createDistribution: (payload) => request('/transactions/distributions', { method: 'POST', body: payload }),

  createReturn: (payload) => request('/transactions/returns', { method: 'POST', body: payload }),

  createAdjustment: (payload) => request('/transactions/adjustments', { method: 'POST', body: payload }),

  listAdjustments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/transactions/adjustments${queryString}`, { method: 'GET' });
  },

  getAdjustmentById: (id) => request(`/transactions/adjustments/${id}`, { method: 'GET' }),

  updateAdjustment: (id, payload) => request(`/transactions/adjustments/${id}`, { method: 'PATCH', body: payload }),
};

export default transactionsAPI;
