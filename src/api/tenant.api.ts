import { apiClient } from './client';

export const tenantApi = {
  getMe: () => apiClient.get('/tenant/me').then((r) => r.data),
  updateSettings: (data: object) => apiClient.patch('/tenant/settings', data).then((r) => r.data),
  updateOnboarding: (step: string) => apiClient.patch('/tenant/onboarding', { step }).then((r) => r.data),
  getUsers: () => apiClient.get('/tenant/users').then((r) => r.data),
};

export const billingApi = {
  getPlans: () => apiClient.get('/billing/plans').then((r) => r.data),
  getCurrent: () => apiClient.get('/billing/current').then((r) => r.data),
  subscribe: (plan: string, paymentMethod: string) =>
    apiClient.post('/billing/subscribe', { plan, paymentMethod }).then((r) => r.data),
  upgrade: (plan: string) => apiClient.post('/billing/upgrade', { plan }).then((r) => r.data),
  cancel: () => apiClient.post('/billing/cancel').then((r) => r.data),
  getInvoices: (params?: object) => apiClient.get('/billing/invoices', { params }).then((r) => r.data),
};

export const productsApi = {
  getAll: (params?: object) => apiClient.get('/products', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/products/${id}`).then((r) => r.data),
  create: (data: object) => apiClient.post('/products', data).then((r) => r.data),
  update: (id: string, data: object) => apiClient.patch(`/products/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/products/${id}`).then((r) => r.data),
};

export const categoriesApi = {
  getAll: () => apiClient.get('/categories').then((r) => r.data),
  getTree: () => apiClient.get('/categories/tree').then((r) => r.data),
  create: (data: object) => apiClient.post('/categories', data).then((r) => r.data),
  update: (id: string, data: object) => apiClient.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/categories/${id}`).then((r) => r.data),
};

export const warehouseApi = {
  getStock: (params?: object) => apiClient.get('/warehouse/stock', { params }).then((r) => r.data),
  getTransactions: (params?: object) => apiClient.get('/warehouse/transactions', { params }).then((r) => r.data),
  getLowStock: () => apiClient.get('/warehouse/low-stock').then((r) => r.data),
  getValue: () => apiClient.get('/warehouse/value').then((r) => r.data),
  purchase: (data: object) => apiClient.post('/warehouse/purchase', data).then((r) => r.data),
  adjustment: (data: object) => apiClient.post('/warehouse/adjustment', data).then((r) => r.data),
  getReport: (from: string, to: string) =>
    apiClient.get('/warehouse/report/movement', { params: { from, to } }).then((r) => r.data),
};

export const ordersApi = {
  getAll: (params?: object) => apiClient.get('/orders', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/orders/${id}`).then((r) => r.data),
  create: (data: object) => apiClient.post('/orders', data).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
  updatePayment: (id: string, data: object) =>
    apiClient.patch(`/orders/${id}/payment`, data).then((r) => r.data),
  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`).then((r) => r.data),
};

export const customersApi = {
  getAll: (params?: object) => apiClient.get('/customers', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/customers/${id}`).then((r) => r.data),
  getOrders: (id: string, params?: object) =>
    apiClient.get(`/customers/${id}/orders`, { params }).then((r) => r.data),
};

export const suppliersApi = {
  getAll: (params?: object) => apiClient.get('/suppliers', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/suppliers/${id}`).then((r) => r.data),
  create: (data: object) => apiClient.post('/suppliers', data).then((r) => r.data),
  update: (id: string, data: object) => apiClient.patch(`/suppliers/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/suppliers/${id}`).then((r) => r.data),
};

export const priceRulesApi = {
  getAll: () => apiClient.get('/price-rules').then((r) => r.data),
  create: (data: object) => apiClient.post('/price-rules', data).then((r) => r.data),
  update: (id: string, data: object) => apiClient.patch(`/price-rules/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/price-rules/${id}`).then((r) => r.data),
  preview: (productIds: string[], ruleIds?: string[]) => apiClient.post('/price-rules/preview', { productIds, ruleIds }).then((r) => r.data),
  batch: (action: string, productIds: string[], data: object) => apiClient.post('/products/batch', { action, productIds, data }).then((r) => r.data),
};

export const reportsApi = {
  getABC: (period?: string) => apiClient.get('/reports/abc', { params: period ? { period } : {} }).then((r) => r.data),
  recalculate: (period?: string) => apiClient.post('/reports/abc/recalculate', null, { params: period ? { period } : {} }).then((r) => r.data),
  getRecommendations: () => apiClient.get('/reports/abc/recommendations').then((r) => r.data),
  getDeadStock: (days?: number) => apiClient.get('/reports/inventory/dead-stock', { params: days ? { days } : {} }).then((r) => r.data),
  getTurnover: () => apiClient.get('/reports/inventory/turnover').then((r) => r.data),
  getProfit: (from: string, to: string) => apiClient.get('/reports/profit', { params: { from, to } }).then((r) => r.data),
  getCashierPerformance: (from: string, to: string) => apiClient.get('/reports/cashier-performance', { params: { from, to } }).then((r) => r.data),
};

export const telegramApi = {
  getConfig: () => apiClient.get('/telegram/config').then((r) => r.data),
  saveConfig: (data: { botToken?: string; chatId?: string; enabled?: boolean }) =>
    apiClient.post('/telegram/config', data).then((r) => r.data),
  test: () => apiClient.post('/telegram/test').then((r) => r.data),
};

export const expensesApi = {
  getAll: (params?: object) => apiClient.get('/expenses', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/expenses/${id}`).then((r) => r.data),
  getSummary: (from: string, to: string) => apiClient.get('/expenses/summary', { params: { from, to } }).then((r) => r.data),
  create: (data: object) => apiClient.post('/expenses', data).then((r) => r.data),
  update: (id: string, data: object) => apiClient.patch(`/expenses/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/expenses/${id}`).then((r) => r.data),
};

export const kassaApi = {
  getSession: () => apiClient.get('/kassa/session/current').then((r) => r.data),
  getSessionStats: (id: string) => apiClient.get(`/kassa/session/${id}/stats`).then((r) => r.data),
  openSession: (data: { openingCash?: number }) => apiClient.post('/kassa/session/open', data).then((r) => r.data),
  closeSession: (id: string, data: { closingCash?: number; notes?: string }) => apiClient.post(`/kassa/session/${id}/close`, data).then((r) => r.data),
  getProducts: (params?: object) => apiClient.get('/kassa/products', { params }).then((r) => r.data),
  checkout: (data: object) => apiClient.post('/kassa/checkout', data).then((r) => r.data),
};

export const purchaseOrdersApi = {
  getAll: (params?: object) => apiClient.get('/purchase-orders', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get(`/purchase-orders/${id}`).then((r) => r.data),
  create: (data: object) => apiClient.post('/purchase-orders', data).then((r) => r.data),
  autoGenerate: () => apiClient.post('/purchase-orders/auto-generate').then((r) => r.data),
  approve: (id: string) => apiClient.post(`/purchase-orders/${id}/approve`).then((r) => r.data),
  receive: (id: string, items: object[]) => apiClient.post(`/purchase-orders/${id}/receive`, { items }).then((r) => r.data),
  cancel: (id: string) => apiClient.post(`/purchase-orders/${id}/cancel`).then((r) => r.data),
  getRules: () => apiClient.get('/purchase-orders/auto-order-rules').then((r) => r.data),
  createRule: (data: object) => apiClient.post('/purchase-orders/auto-order-rules', data).then((r) => r.data),
  updateRule: (id: string, data: object) => apiClient.patch(`/purchase-orders/auto-order-rules/${id}`, data).then((r) => r.data),
  deleteRule: (id: string) => apiClient.delete(`/purchase-orders/auto-order-rules/${id}`).then((r) => r.data),
};
