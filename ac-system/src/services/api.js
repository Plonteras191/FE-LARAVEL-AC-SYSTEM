import axios from 'axios';
//src/services/api.js
// Base URL for Laravel API
export const API_BASE_URL = 'http://localhost:8000/api';

// Create a pre-configured axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// API endpoints functions
export const appointmentsApi = {
  getAll: () => apiClient.get('/appointments'),
  delete: (id) => apiClient.delete(`/appointments/${id}`),
  accept: (id) => apiClient.post(`/appointments/${id}/accept`),
  complete: (id) => apiClient.post(`/appointments/${id}/complete`),
  reschedule: (id, payload) => apiClient.put(`/appointments/${id}?action=reschedule`, payload)
};

export default apiClient;