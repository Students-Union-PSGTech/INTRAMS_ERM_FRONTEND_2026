import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const resolveAssetUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${ASSET_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = sessionStorage.getItem('userRefreshToken');
    if (error.response?.status === 401 && refreshToken && !originalRequest._retried && !originalRequest.url.includes('/refresh')) {
      originalRequest._retried = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/user/refresh`, { refreshToken });
        sessionStorage.setItem('userToken', data.token);
        sessionStorage.setItem('userRefreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (_) {
        // Fall through to local logout.
      }
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userRefreshToken');
      sessionStorage.removeItem('userData');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRefreshToken');
      localStorage.removeItem('userData');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  requestEditAccess: (id, message, requestType = 'event_edit') => api.post(`/user/events/${id}/request-edit`, { message, request_type: requestType }),
  getMyEditRequests: () => api.get('/user/edit-requests'),
  getEventPDF: (eventId) => api.get(`/user/events/${eventId}/pdf`, { responseType: 'blob' }),
  getItems: () => api.get('/user/items'),
  // Annexures API
  getAnnexures: (eventId) => api.get(`/user/events/${eventId}/annexures`),
  uploadAnnexure: (eventId, formData) => api.post(`/user/events/${eventId}/annexures`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAnnexure: (annexureId) => api.delete(`/user/annexures/${annexureId}`)
};

export default api;
