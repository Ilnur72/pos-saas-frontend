import { superAdminClient } from './client';

export const superAdminApi = {
  getStats: () => superAdminClient.get('/superadmin/stats').then((r) => r.data),

  getTenants: (params?: object) =>
    superAdminClient.get('/superadmin/tenants', { params }).then((r) => r.data),

  getTenant: (id: string) =>
    superAdminClient.get(`/superadmin/tenants/${id}`).then((r) => r.data),

  suspendTenant: (id: string, reason: string) =>
    superAdminClient.post(`/superadmin/tenants/${id}/suspend`, { reason }).then((r) => r.data),

  activateTenant: (id: string) =>
    superAdminClient.post(`/superadmin/tenants/${id}/activate`).then((r) => r.data),

  changePlan: (id: string, plan: string) =>
    superAdminClient.post(`/superadmin/tenants/${id}/change-plan`, { plan }).then((r) => r.data),

  extendTrial: (id: string, days: number) =>
    superAdminClient.post(`/superadmin/tenants/${id}/extend-trial`, { days }).then((r) => r.data),

  getMrrChart: (months?: number) =>
    superAdminClient.get('/superadmin/mrr-chart', { params: { months } }).then((r) => r.data),

  getHealth: () => superAdminClient.get('/superadmin/system/health').then((r) => r.data),
};
