import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantSlug: string | null;
  tenantRole: string | null;
  tenant: TenantInfo | null;
  superAdminToken: string | null;

  setAuth: (tokens: { accessToken: string; refreshToken?: string }, tenantSlug: string, role: string, tenant?: TenantInfo) => void;
  setSuperAdminToken: (token: string) => void;
  logout: () => void;
  logoutSuperAdmin: () => void;
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      tenantSlug: null,
      tenantRole: null,
      tenant: null,
      superAdminToken: null,

      setAuth: (tokens, tenantSlug, role, tenant) => {
        localStorage.setItem('saas_access_token', tokens.accessToken);
        if (tokens.refreshToken) localStorage.setItem('saas_refresh_token', tokens.refreshToken);
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? get().refreshToken, tenantSlug, tenantRole: role, tenant: tenant ?? null });
      },

      setSuperAdminToken: (token) => {
        localStorage.setItem('saas_superadmin_token', token);
        set({ superAdminToken: token });
      },

      logout: () => {
        localStorage.removeItem('saas_access_token');
        localStorage.removeItem('saas_refresh_token');
        set({ accessToken: null, refreshToken: null, tenantSlug: null, tenantRole: null, tenant: null });
      },

      logoutSuperAdmin: () => {
        localStorage.removeItem('saas_superadmin_token');
        set({ superAdminToken: null });
      },

      isAuthenticated: () => !!get().accessToken,
      isSuperAdmin: () => !!get().superAdminToken,
    }),
    { name: 'saas-auth' },
  ),
);
