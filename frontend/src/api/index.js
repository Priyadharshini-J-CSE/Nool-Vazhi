import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('nv_user') || '{}');
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const authAPI = {
  registerOrg: (data) => API.post('/auth/register/organization', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  registerDriver: (data) => API.post('/auth/register/driver', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  loginOrg: (data) => API.post('/auth/login/organization', data),
  loginDriver: (data) => API.post('/auth/login/driver', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (userId, token, data) => API.post(`/auth/reset-password/${userId}/${token}`, data),
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
  updateLocation: (id, data) => API.put(`/shipments/${id}/location`, data),
};

export const trackingAPI = {
  track: (id) => API.get(`/tracking/${id}`),
};

export const pricingAPI = {
  estimate: (bundles, season) => API.get(`/pricing/estimate?bundles=${bundles}&season=${season}`),
};

export const tripAPI = {
  create: (data) => API.post('/trips', data),
  search: (from, to) => API.get(`/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  book: (data) => API.post('/trips/book', data),
  myTrips: () => API.get('/trips/my-trips'),
  myBookings: () => API.get('/trips/my-bookings'),
  tripBookings: (id) => API.get(`/trips/${id}/bookings`),
  updateStatus: (id, status) => API.put(`/trips/${id}/status`, { status }),
  driverStats: () => API.get('/trips/driver-stats'),
  locations: () => API.get('/trips/locations'),
};

export default API;
