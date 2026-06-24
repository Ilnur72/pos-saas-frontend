import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, Users, AlertTriangle, TrendingUp, DollarSign, TrendingDown, Receipt, Calendar } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { UsageBar } from '@/components/ui/UsageBar';
import { tenantApi, warehouseApi, ordersApi, reportsApi, expensesApi } from '@/api/tenant.api';
import { formatCurrency, getStatusLabel, getStatusColor, formatDateTime } from '@/lib/formatters';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

function today() { return new Date().toISOString().slice(0, 10); }
function startOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function startOfDay() { return new Date().toISOString().slice(0, 10); }
function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"; }

export default function DashboardPage() {
  const { tenantRole } = useAuthStore();
  const canSeeProfit = tenantRole === 'OWNER' || tenantRole === 'ADMIN';

  const { data: tenantMe } = useQuery({ queryKey: ['tenant', 'me'], queryFn: tenantApi.getMe });
  const { data: lowStock } = useQuery({ queryKey: ['warehouse', 'low-stock'], queryFn: warehouseApi.getLowStock });
  const { data: recentOrders } = useQuery({ queryKey: ['orders', 'recent'], queryFn: () => ordersApi.getAll({ limit: 5 }) });

  // Bugungi foyda — faqat OWNER/ADMIN
  const { data: todayProfit } = useQuery({
    queryKey: ['profit', 'today'],
    queryFn: () => reportsApi.getProfit(today() + 'T00:00:00', today() + 'T23:59:59'),
    enabled: canSeeProfit,
  });

  // Bu oy foyda
  const { data: monthProfit } = useQuery({
    queryKey: ['profit', 'month'],
    queryFn: () => reportsApi.getProfit(startOfMonth() + 'T00:00:00', today() + 'T23:59:59'),
    enabled: canSeeProfit,
  });

  // Bu oy chiqim
  const { data: monthExpenses } = useQuery({
    queryKey: ['expenses', 'month-summary'],
    queryFn: () => expensesApi.getSummary(startOfMonth(), today() + 'T23:59:59'),
  });

  const usage = (tenantMe as any)?.usage;

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{(tenantMe as any)?.name}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl">
          <Calendar className="h-3.5 w-3.5" />
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* OWNER/ADMIN — Bugungi foyda paneli */}
      {canSeeProfit && todayProfit && (
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">Bugungi natija</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs opacity-80 mb-1">💰 Tushum</p>
              <p className="text-2xl font-black">{fmt(todayProfit.summary.totalRevenue)}</p>
              <p className="text-xs opacity-70 mt-0.5">{todayProfit.summary.salesCount} ta sotuv</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">📈 Yalpi foyda</p>
              <p className="text-2xl font-black">{fmt(todayProfit.summary.grossProfit)}</p>
              <p className="text-xs opacity-70 mt-0.5">{todayProfit.summary.grossMargin}% margin</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">💸 Chiqim</p>
              <p className="text-2xl font-black">{fmt(todayProfit.summary.totalExpenses)}</p>
            </div>
            <div className="border-l-2 border-white/30 pl-6">
              <p className="text-xs opacity-80 mb-1">💵 Sof foyda</p>
              <p className={`text-3xl font-black ${todayProfit.summary.netProfit >= 0 ? '' : 'text-red-200'}`}>
                {fmt(todayProfit.summary.netProfit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bu oy ko'rsatkichlari */}
      {canSeeProfit && monthProfit && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Bu oy tushum"
            value={fmt(monthProfit.summary.totalRevenue)}
            icon={DollarSign}
            iconClass="text-emerald-600 bg-emerald-50"
          />
          <MetricCard
            title="Bu oy foyda"
            value={fmt(monthProfit.summary.grossProfit)}
            icon={TrendingUp}
            iconClass="text-violet-600 bg-violet-50"
          />
          <MetricCard
            title="Bu oy chiqim"
            value={fmt(monthProfit.summary.totalExpenses)}
            icon={TrendingDown}
            iconClass="text-red-600 bg-red-50"
          />
          <MetricCard
            title="Sof foyda (oy)"
            value={fmt(monthProfit.summary.netProfit)}
            icon={Receipt}
            iconClass={monthProfit.summary.netProfit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
          />
        </div>
      )}

      {/* Manager/staff uchun oddiy ko'rsatkichlar */}
      {!canSeeProfit && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Jami mahsulot" value={usage?.skus?.current ?? '—'} icon={Package} iconClass="text-violet-600 bg-violet-50" />
          <MetricCard title="Bu oy buyurtma" value={usage?.orders?.current ?? '—'} icon={ShoppingBag} iconClass="text-indigo-600 bg-indigo-50" />
          <MetricCard title="Kam qolgan" value={(lowStock as any[])?.length ?? '—'} icon={AlertTriangle} iconClass="text-amber-600 bg-amber-50" />
          <MetricCard title="Bu oy chiqim" value={monthExpenses ? fmt(monthExpenses.total) : '—'} icon={TrendingDown} iconClass="text-red-600 bg-red-50" />
        </div>
      )}

      {/* Plan usage */}
      {usage && canSeeProfit && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">Plan foydalanishi — {(tenantMe as any)?.plan}</h2>
            <Link to="/billing" className="text-xs text-violet-600 font-semibold hover:underline">Upgrade →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <UsageBar label="Mahsulotlar (SKU)" {...usage.skus} />
            <UsageBar label="Foydalanuvchilar" {...usage.users} />
            <UsageBar label="Buyurtmalar (oy)" {...usage.orders} />
          </div>
        </div>
      )}

      {/* Tezkor havolalar */}
      {canSeeProfit && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/reports/profit" className="bg-white border border-gray-100 hover:border-violet-300 hover:shadow-md rounded-2xl p-4 transition-all">
            <DollarSign className="h-5 w-5 text-violet-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Foyda hisoboti</p>
            <p className="text-xs text-gray-500 mt-0.5">Batafsil tahlil</p>
          </Link>
          <Link to="/reports/cashiers" className="bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md rounded-2xl p-4 transition-all">
            <Users className="h-5 w-5 text-emerald-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Kassirlar</p>
            <p className="text-xs text-gray-500 mt-0.5">Samaradorlik + kamomad</p>
          </Link>
          <Link to="/expenses" className="bg-white border border-gray-100 hover:border-red-300 hover:shadow-md rounded-2xl p-4 transition-all">
            <Receipt className="h-5 w-5 text-red-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Chiqimlar</p>
            <p className="text-xs text-gray-500 mt-0.5">Ijara, oylik, kommunal</p>
          </Link>
          <Link to="/reports/abc" className="bg-white border border-gray-100 hover:border-blue-300 hover:shadow-md rounded-2xl p-4 transition-all">
            <TrendingUp className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">ABC tahlil</p>
            <p className="text-xs text-gray-500 mt-0.5">Eng muhim mahsulotlar</p>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">So'nggi buyurtmalar</h2>
            <Link to="/orders" className="text-xs text-violet-600 font-semibold hover:underline">Hammasi →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {((recentOrders as any)?.data ?? []).map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{o.customerName} · {formatDateTime(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(Number(o.totalAmount))}</p>
                </div>
              </div>
            ))}
            {!((recentOrders as any)?.data?.length) && (
              <p className="text-sm text-gray-400 text-center py-8">Buyurtmalar yo'q</p>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Kam qolgan mahsulotlar
            </h2>
            <Link to="/warehouse" className="text-xs text-violet-600 font-semibold hover:underline">Ombor →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {((lowStock as any[]) ?? []).slice(0, 5).map((item: any) => (
              <div key={item.productId} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.totalQty <= 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}`}>
                  {item.totalQty} ta
                </span>
              </div>
            ))}
            {!((lowStock as any[])?.length) && (
              <p className="text-sm text-gray-400 text-center py-8">Barcha mahsulotlar yetarli</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
