import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('nv_user') || '{}');
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const authAPI = {
  registerOrg: (data) => API.post('/auth/register/organization', data),
  registerDriver: (data) => API.post('/auth/register/driver', data),
  loginOrg: (data) => API.post('/auth/login/organization', data),
  loginDriver: (data) => API.post('/auth/login/driver', data),
  profile: () => API.get('/auth/profile'),
};

export const shipmentAPI = {
  create: (data) => API.post('/shipments', data),
  getAll: () => API.get('/shipments'),
  getById: (id) => API.get(`/shipments/${id}`),
  updateStatus: (id, data) => API.put(`/shipments/${id}`, data),
  getStats: () => API.get('/shipments/stats'),
  getDriverStats: () => API.get('/shipments/driver-stats'),
  getAvailable: () => API.get('/shipments/available'),
  accept: (id) => API.put(`/shipments/${id}/accept`),
};

export const trackingAPI = {
  track: (id) => API.get(`/tracking/${id}`),
};

export const pricingAPI = {
  estimate: (bundles, season) => API.get(`/pricing/estimate?bundles=${bundles}&season=${season}`),
};

export default API;
