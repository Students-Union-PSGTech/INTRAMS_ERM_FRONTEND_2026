import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
let refreshPromise = null;
const clearSession = () => ['userToken','userRefreshToken','userData'].forEach((key) => localStorage.removeItem(key));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  const refreshToken = localStorage.getItem('userRefreshToken');
  if (error.response?.status === 401 && originalRequest && refreshToken && !originalRequest._retried && !String(originalRequest.url).includes('/refresh')) {
    originalRequest._retried = true;
    try {
      refreshPromise ||= axios.post(`${API_BASE_URL}/user/refresh`, { refreshToken });
      const { data } = await refreshPromise;
      if (!data?.token) throw new Error('Invalid refresh response');
      localStorage.setItem('userToken', data.token);
      if (data.refreshToken) localStorage.setItem('userRefreshToken', data.refreshToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (_) {
      clearSession();
    } finally {
      refreshPromise = null;
    }
  }
  if (error.response?.status === 401) {
    clearSession();
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  return Promise.reject(error);
});

export const userAPI = {
  login: (credentials) => api.post('/user/login', credentials),
  refresh: (refreshToken) => api.post('/user/refresh', { refreshToken }),
  logout: () => api.post('/user/logout'),
  getProfile: () => api.get('/user/profile'),
  getEvents: () => api.get('/user/events'),
  getMyEvents: () => api.get('/user/events'),
  getEventById: (id) => api.get(`/user/events/${id}`),
  createEvent: (eventData) => api.post('/user/events', eventData),
  updateEvent: (id, eventData) => api.put(`/user/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/user/events/${id}`),
  requestEditAccess: (id, message) => api.post(`/user/events/${id}/request-edit`, { message }),
  getEventPDF: (eventId) => api.get(`/user/events/${eventId}/pdf`, { responseType: 'blob' }),
  getItems: () => api.get('/user/items'),
  getAnnexures: (eventId) => api.get(`/user/events/${eventId}/annexures`),
  uploadAnnexure: (eventId, formData) => api.post(`/user/events/${eventId}/annexures`, formData),
  deleteAnnexure: (annexureId) => api.delete(`/user/annexures/${annexureId}`)
};

export default api;
