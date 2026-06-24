import { apiClient, superAdminClient } from './client';

export const authApi = {
  login: (data: { email: string; password: string; tenantSlug: string }) =>
    apiClient.post('/auth/login', data).then((r) => r.data),

  superAdminLogin: (data: { email: string; password: string }) =>
    superAdminClient.post('/auth/superadmin/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),

  invite: (data: { email: string; role: string }) =>
    apiClient.post('/auth/invite', data).then((r) => r.data),

  acceptInvite: (data: { token: string; name: string; password: string }) =>
    apiClient.post('/auth/accept-invite', data).then((r) => r.data),
};
