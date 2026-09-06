import request from './client';

export const locationsAPI = {
  listLocations: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') query.append('is_active', params.is_active);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/locations${queryString}`, { method: 'GET' });
  },

  getLocationById: (id) => request(`/locations/${id}`, { method: 'GET' }),

  createLocation: (payload) => request('/locations', { method: 'POST', body: payload }),

  updateLocation: (id, payload) => request(`/locations/${id}`, { method: 'PATCH', body: payload }),
};

export default locationsAPI;
