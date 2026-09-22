import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intrams-erm-backend-2026.onrender.com/api';
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
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (error.response?.status === 401 && refreshToken && !originalRequest._retried && !originalRequest.url.includes('/refresh')) {
      originalRequest._retried = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/admin/refresh`, { refreshToken });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (_) {
        // Fall through to local logout.
      }
    }
    if (error.response?.status === 401) {
      sessionStorage.clear();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  refresh: (refreshToken) => api.post('/admin/refresh', { refreshToken }),
  logout: () => api.post('/admin/logout'),
  forgotPassword: (email) => api.post('/admin/forgot-password', { email }),
  resetPassword: (data) => api.post('/admin/reset-password', data),

  // Association Management
  getAssociations: () => api.get('/admin/associations'),
  createAssociation: (data) => api.post('/admin/associations', data),
  updateAssociation: (id, data) => api.put(`/admin/associations/${id}`, data),
  deleteAssociation: (id) => api.delete(`/admin/associations/${id}`),

  // Events & Access
  getEvents: () => api.get('/admin/events'),
  getEventById: (id) => api.get(`/admin/events/${id}`),
  updateEventStatus: (id, status, reason) => api.put(`/admin/events/${id}/status`, { status, reason }),
  updateLabStatus: (id, data) => api.put(`/admin/events/${id}/lab-status`, data),
  getRequestedEvents: () => api.get('/admin/edit-requests'),
  giveEditAccess: (requestId, decision) => api.post(`/admin/edit-requests/${requestId}`, { decision }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),

  // Items & Stocks
  getItems: () => api.get('/admin/items'),
  createItem: (data) => api.post('/admin/items', data),
  updateItem: (id, data) => api.put(`/admin/items/${id}`, data),
  deleteItem: (id) => api.delete(`/admin/items/${id}`),

  getStocks: () => api.get('/admin/stocks'),
  updateStock: (id, data) => api.put(`/admin/stocks/${id}`, data),

  // Grants
  getEventsByAssociation: (associationId) => api.get(`/admin/associations/${associationId}/events`),
  getEventQuantityToProvide: (eventId) => api.get(`/admin/events/${eventId}/grant-details`),
  grantItemsToEvent: (data) => api.post('/admin/grants', data),
  getEventGrantHistory: (eventId) => api.get(`/admin/events/${eventId}/grants`),
  getAllGrants: () => api.get('/admin/grants'),
  getProcurements: () => api.get('/admin/procurements'),
  updateProcurementStatus: (id, status) => api.put(`/admin/procurements/${id}/status`, { status }),
  revertGrant: (grantId) => api.delete(`/admin/grants/${grantId}`),
  updateSuSource: (data) => api.put('/admin/grants/su-source', data),


  // PDFs & Statistics
  getEventPDF: (eventId) => api.get(`/admin/pdf/event/${eventId}`, { responseType: 'blob' }),
  getEventItemsPDF: (eventId) => api.get(`/admin/pdf/items/${eventId}`, { responseType: 'blob' }),
  getProcurementPDF: (eventId) => api.get(`/admin/pdf/procurement/${eventId}`, { responseType: 'blob' }),
  getEventsSummaryPDF: () => api.get('/admin/pdf/summary', { responseType: 'blob' }),
  getRoleWisePDF: (role) => api.get(`/admin/pdf/role/${role}`, { responseType: 'blob' }),

  getStats: () => api.get('/admin/stats'),
  getRoleMembers: (role) => api.get(`/admin/personnel/${role}`),
  getLogs: () => api.get('/admin/logs'),
  checkHealth: () => api.get(`${ASSET_BASE_URL}/health`),
};


export default api;
