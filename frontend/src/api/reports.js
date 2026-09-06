import request from './client';

export const reportsAPI = {
  getStockReport: (params = {}) => {
    const query = new URLSearchParams();
    if (params.location_id) query.append('location_id', params.location_id);
    if (params.category_id) query.append('category_id', params.category_id);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/reports/stock${queryString}`, { method: 'GET' });
  },

  getMovementsReport: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from_date) query.append('from_date', params.from_date);
    if (params.to_date) query.append('to_date', params.to_date);
    if (params.item_id) query.append('item_id', params.item_id);
    if (params.location_id) query.append('location_id', params.location_id);
    if (params.movement_type) query.append('movement_type', params.movement_type);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/reports/movements${queryString}`, { method: 'GET' });
  },

  getInwardReport: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from_date) query.append('from_date', params.from_date);
    if (params.to_date) query.append('to_date', params.to_date);
    if (params.supplier_id) query.append('supplier_id', params.supplier_id);
    if (params.location_id) query.append('location_id', params.location_id);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/reports/inward${queryString}`, { method: 'GET' });
  },

  getOutwardReport: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from_date) query.append('from_date', params.from_date);
    if (params.to_date) query.append('to_date', params.to_date);
    if (params.location_id) query.append('location_id', params.location_id);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/reports/outward${queryString}`, { method: 'GET' });
  },
};

export default reportsAPI;
