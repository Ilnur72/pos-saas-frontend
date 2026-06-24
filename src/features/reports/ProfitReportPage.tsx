import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Package, BarChart3, Calendar } from 'lucide-react';
import { reportsApi } from '@/api/tenant.api';

interface ProfitData {
  period: { from: string; to: string };
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    grossMargin: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    totalQty: number;
  };
  expensesByCategory: { category: string; amount: number }[];
  topProducts: Array<{
    product: { id: string; name: string; sku: string };
    revenue: number; cost: number; profit: number; margin: number; qty: number;
  }>;
  worstProducts: any[];
}

const EXP_CAT_LABELS: Record<string, string> = {
  RENT: 'Ijara', SALARY: 'Oylik', UTILITY: 'Kommunal', PURCHASE: 'Xarid', TAX: 'Soliq', TRANSPORT: 'Transport', OTHER: 'Boshqa',
};

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"; }

function startOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function ProfitReportPage() {
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ from: string; to: string }>({ from: startOfMonth(), to: today() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await reportsApi.getProfit(filter.from, filter.to + 'T23:59:59');
      setData(r);
    } catch { setData(null); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setQuick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilter({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foyda hisoboti</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daromad, tannarx va sof foyda</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setQuick(7)} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">7 kun</button>
            <button onClick={() => setQuick(30)} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">30 kun</button>
            <button onClick={() => setQuick(90)} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">90 kun</button>
            <button onClick={() => setFilter({ from: startOfMonth(), to: today() })} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">Bu oy</button>
          </div>
          <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Yuklanmoqda...</div>
      ) : !data || data.summary.salesCount === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 className="h-12 w-12 mb-3 opacity-40" />
          <p>Bu davrda sotuv yo'q</p>
        </div>
      ) : (
        <>
          {/* Asosiy ko'rsatkichlar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Daromad"
              value={fmt(data.summary.totalRevenue)}
              color="emerald"
              sub={`${data.summary.salesCount} ta sotuv`}
            />
            <StatCard
              icon={Package}
              label="Tannarx"
              value={fmt(data.summary.totalCost)}
              color="gray"
              sub={`${data.summary.totalQty} ta mahsulot`}
            />
            <StatCard
              icon={TrendingUp}
              label="Yalpi foyda"
              value={fmt(data.summary.grossProfit)}
              color="violet"
              sub={`${data.summary.grossMargin}% margin`}
            />
            <StatCard
              icon={data.summary.netProfit >= 0 ? TrendingUp : TrendingDown}
              label="Sof foyda"
              value={fmt(data.summary.netProfit)}
              color={data.summary.netProfit >= 0 ? 'green' : 'red'}
              sub="chiqimlar minus"
              highlight
            />
          </div>

          {/* Foyda hisobi vizualizatsiya */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Foyda struktrasi</h3>
            <div className="space-y-3">
              <ProfitBar label="Daromad" value={data.summary.totalRevenue} max={data.summary.totalRevenue} color="bg-emerald-500" />
              <ProfitBar label="− Tannarx" value={data.summary.totalCost} max={data.summary.totalRevenue} color="bg-gray-400" sign="−" />
              <ProfitBar label="= Yalpi foyda" value={data.summary.grossProfit} max={data.summary.totalRevenue} color="bg-violet-500" sign="=" />
              <ProfitBar label="− Chiqimlar" value={data.summary.totalExpenses} max={data.summary.totalRevenue} color="bg-red-400" sign="−" />
              <div className="border-t border-gray-100 pt-3">
                <ProfitBar
                  label="= Sof foyda"
                  value={Math.abs(data.summary.netProfit)}
                  max={data.summary.totalRevenue}
                  color={data.summary.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'}
                  sign="="
                  highlight
                  negative={data.summary.netProfit < 0}
                />
              </div>
            </div>
          </div>

          {/* Chiqimlar bo'yicha */}
          {data.expensesByCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Chiqimlar tarkibi
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.expensesByCategory.map((c) => (
                  <div key={c.category} className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="text-xs font-semibold text-red-600 uppercase">{EXP_CAT_LABELS[c.category] ?? c.category}</p>
                    <p className="text-lg font-bold text-red-700 mt-0.5">{fmt(c.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eng foydali mahsulotlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">Eng foydali 20 ta mahsulot</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Mahsulot</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Sotilgan</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Daromad</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Tannarx</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Foyda</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topProducts.map((p, idx) => (
                  <tr key={p.product.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{p.product.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.product.sku}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{p.qty}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">{fmt(p.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{fmt(p.cost)}</td>
                    <td className="px-4 py-2.5 text-right text-violet-700 font-bold">{fmt(p.profit)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.margin > 0.3 ? 'bg-green-100 text-green-700' : p.margin > 0.1 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {(p.margin * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub, highlight }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${colorMap[color]} ${highlight ? 'shadow-md' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="h-4 w-4 opacity-60" />
        <span className="text-[10px] font-bold uppercase opacity-70">{label}</span>
      </div>
      <p className="text-xl font-black mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}

function ProfitBar({ label, value, max, color, sign, highlight, negative }: any) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-semibold ${highlight ? 'text-base' : ''}`}>{label}</span>
        <span className={`font-bold ${highlight ? 'text-lg' : ''} ${negative ? 'text-red-600' : ''}`}>{sign === '−' ? '− ' : ''}{fmt(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
