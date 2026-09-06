import request from './client';

export const dashboardAPI = {
  getSummary: () => request('/dashboard/summary', { method: 'GET' }),

  getLowStock: () => request('/dashboard/low-stock', { method: 'GET' }),

  getOutOfStock: () => request('/dashboard/out-of-stock', { method: 'GET' }),

  getRecentTransactions: (limit = 10) => request(`/dashboard/recent-transactions?limit=${limit}`, { method: 'GET' }),

  getCategoryStock: () => request('/dashboard/category-stock', { method: 'GET' }),

  getLocationStock: () => request('/dashboard/location-stock', { method: 'GET' }),
};

export default dashboardAPI;
