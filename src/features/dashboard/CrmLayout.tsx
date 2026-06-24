import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { BarChart2, Package, Layers, Warehouse, ShoppingBag, Users, Truck, CreditCard, Settings, LogOut, Zap, ChevronRight, ClipboardList, TrendingUp, Tag, Monitor, Bell, AlertTriangle, X, TrendingDown, DollarSign, UserCheck, Menu, Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { warehouseApi } from '@/api/tenant.api';

type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';

const nav: { to: string; label: string; icon: any; exact?: boolean; roles?: Role[] }[] = [
  { to: '/', label: 'Dashboard', icon: BarChart2, exact: true, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/kassa', label: 'Kassa (POS)', icon: Monitor },
  { to: '/products', label: 'Mahsulotlar', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/categories', label: 'Kategoriyalar', icon: Layers, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/warehouse', label: 'Ombor', icon: Warehouse, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/warehouse/value', label: 'Ombor qiymati', icon: DollarSign, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/orders', label: 'Buyurtmalar', icon: ShoppingBag, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/expenses', label: 'Chiqimlar', icon: TrendingDown },
  { to: '/purchase-orders', label: 'Zakaz boshqaruvi', icon: ClipboardList, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/reports/profit', label: 'Foyda hisoboti', icon: DollarSign, roles: ['OWNER', 'ADMIN'] },
  { to: '/reports/cashiers', label: 'Kassirlar', icon: UserCheck, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/reports/abc', label: 'ABC Tahlil', icon: TrendingUp, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/customers', label: 'Mijozlar', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/suppliers', label: 'Yetkazib beruvchilar', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/price-rules', label: 'Narx qoidalari', icon: Tag, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/billing', label: 'Billing', icon: CreditCard, roles: ['OWNER', 'ADMIN'] },
  { to: '/settings', label: 'Sozlamalar', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  totalQty: number;
  minStockLevel: number;
}

export default function CrmLayout() {
  const navigate = useNavigate();
  const { tenant, tenantRole, logout } = useAuthStore();
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isCashier = tenantRole === 'CASHIER';

  const fetchLowStock = useCallback(async () => {
    if (isCashier) return;
    try {
      const data = await warehouseApi.getLowStock();
      setLowStock(Array.isArray(data) ? data : data.data ?? []);
    } catch { /* ignore */ }
  }, [isCashier]);

  useEffect(() => {
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 5 * 60 * 1000); // har 5 daqiqa
    return () => clearInterval(interval);
  }, [fetchLowStock]);

  // CASHIER faqat /kassa va /expenses ko'rishi mumkin
  useEffect(() => {
    if (!isCashier) return;
    const path = window.location.pathname;
    if (path === '/' || (!path.startsWith('/kassa') && !path.startsWith('/expenses'))) {
      navigate({ to: '/kassa' });
    }
  }, [isCashier, navigate]);

  // Outside click listener
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleLogout = () => { logout(); navigate({ to: '/login' }); };

  const goToWarehouse = () => {
    setBellOpen(false);
    navigate({ to: '/warehouse' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-white rounded-xl shadow-md"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow flex-shrink-0">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{tenant?.name ?? 'Do\'kon'}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{tenantRole}</p>
              </div>
            </div>

            {/* Notification bell — CASHIER ko'rmaydi */}
            {!isCashier && (
            <div ref={bellRef} className="relative flex-shrink-0">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Kam qolgan tovarlar"
              >
                <Bell className="h-4.5 w-4.5 text-gray-500" />
                {lowStock.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {lowStock.length > 99 ? '99+' : lowStock.length}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {bellOpen && (
                <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-bold text-gray-900">Kam qolgan tovarlar</span>
                    </div>
                    <button onClick={() => setBellOpen(false)} className="p-0.5 hover:bg-gray-100 rounded-lg">
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>

                  {lowStock.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-400">Hamma tovar yetarli</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {lowStock.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                              <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                            </div>
                            <div className="flex-shrink-0 ml-3 text-right">
                              <span className={`text-sm font-bold ${item.totalQty <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                {item.totalQty} ta
                              </span>
                              <p className="text-[10px] text-gray-400">min: {item.minStockLevel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100">
                        <button
                          onClick={goToWarehouse}
                          className="w-full text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors"
                        >
                          Omborga o'tish →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.filter((n) => !n.roles || !tenantRole || n.roles.includes(tenantRole as Role)).map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              activeProps={{ className: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-700 bg-violet-50' }}
              activeOptions={exact ? { exact: true } : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {/* Ombor linkida low stock badge */}
              {to === '/warehouse' && lowStock.length > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {lowStock.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          {tenant && !isCashier && (
            <a
              href={`/shop/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              Onlayn do'konni ko'rish
              <ChevronRight className="h-3 w-3 ml-auto" />
            </a>
          )}
          {tenant && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Plan: <strong className="text-gray-700">{tenant.plan}</strong></span>
                <Link to="/billing" className="text-violet-600 hover:underline flex items-center gap-0.5">
                  Upgrade <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="p-4 lg:p-7 pt-14 lg:pt-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
