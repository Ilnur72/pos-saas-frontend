import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { BarChart2, Building2, CreditCard, LogOut, Monitor, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const nav = [
  { to: '/superadmin', label: 'Dashboard', icon: BarChart2, exact: true },
  { to: '/superadmin/tenants', label: 'Tenantlar', icon: Building2 },
  { to: '/superadmin/billing', label: 'Billing', icon: CreditCard },
  { to: '/superadmin/system', label: 'Tizim', icon: Monitor },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const { logoutSuperAdmin } = useAuthStore();

  const handleLogout = () => {
    logoutSuperAdmin();
    navigate({ to: '/superadmin/login' });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Super Admin</p>
              <p className="text-[10px] text-slate-500">Platforma boshqaruvi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              activeProps={{ className: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-slate-800' }}
              activeOptions={to === '/superadmin' ? { exact: true } : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
