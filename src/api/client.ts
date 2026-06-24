import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject tenant auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap { data: value } responses
apiClient.interceptors.response.use(
  (response) => {
    const d = response.data;
    if (d && typeof d === 'object' && 'data' in d && !('meta' in d)) {
      response.data = (d as { data: unknown }).data;
    }
    return response;
  },
  (error) => {
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('saas_access_token');
      localStorage.removeItem('saas_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const superAdminClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

superAdminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas_superadmin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminClient.interceptors.response.use(
  (response) => {
    const d = response.data;
    if (d && typeof d === 'object' && 'data' in d && !('meta' in d)) {
      response.data = (d as { data: unknown }).data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saas_superadmin_token');
      window.location.href = '/superadmin/login';
    }
    return Promise.reject(error);
  },
);
