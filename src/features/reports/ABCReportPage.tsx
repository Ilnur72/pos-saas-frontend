import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { reportsApi } from '@/api/tenant.api';

type Period = '30d' | '90d' | '180d';

interface ABCItem {
  productId: string; category: 'A' | 'B' | 'C';
  revenue: number; revenueShare: number; cumulative: number;
  product?: { id: string; name: string; sku: string; imageUrls?: string[] };
}
interface ABCData { items: ABCItem[]; summary: { A: number; B: number; C: number }; total: number; period: string; cachedAt?: string }
interface Recommendation { type: string; priority: string; message: string; products: { id: string; name: string; sku: string }[] }

const CAT_COLORS = { A: '#7c3aed', B: '#3b82f6', C: '#9ca3af' };
const PRIORITY_COLORS: Record<string, string> = { HIGH: 'bg-red-50 border-red-200 text-red-700', MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700', LOW: 'bg-gray-50 border-gray-200 text-gray-700' };
const TYPE_LABELS: Record<string, string> = { REORDER: 'Qayta zakaz', DEAD_STOCK: 'Eski stok', OVERSTOCK: "Ko'p stok" };

function formatMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)); }

export default function ABCReportPage() {
  const [period, setPeriod] = useState<Period>('90d');
  const [data, setData] = useState<ABCData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [tab, setTab] = useState<'abc' | 'recommendations'>('abc');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filterCat, setFilterCat] = useState<'A' | 'B' | 'C' | 'all'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const [abcData, recsData] = await Promise.all([reportsApi.getABC(period), reportsApi.getRecommendations()]);
      setData(abcData);
      setRecs(Array.isArray(recsData) ? recsData : recsData.data ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try { const r = await reportsApi.recalculate(period); setData(r); } catch { /* ignore */ } finally { setRecalculating(false); }
  };

  useEffect(() => { load(); }, [period]);

  const filteredItems = (data?.items ?? []).filter((i) => filterCat === 'all' || i.category === filterCat);
  const top20 = (data?.items ?? []).slice(0, 20);

  const chartData = top20.map((item, idx) => ({
    name: item.product?.name ? item.product.name.slice(0, 15) + (item.product.name.length > 15 ? '…' : '') : `#${idx + 1}`,
    revenue: Math.round(item.revenue),
    category: item.category,
    cumulative: Math.round(item.cumulative * 100),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ABC Tahlil</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.cachedAt ? `Hisoblangan: ${new Date(data.cachedAt).toLocaleDateString('uz-UZ')}` : 'Mahsulotlarni daromad bo\'yicha tasnifla'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['30d', '90d', '180d'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                {p === '30d' ? '30 kun' : p === '90d' ? '90 kun' : '180 kun'}
              </button>
            ))}
          </div>
          <button onClick={handleRecalculate} disabled={recalculating} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} /> Qayta hisoblash
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Yuklanmoqda...</div>
      ) : !data || !data.items.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 className="h-12 w-12 mb-3 opacity-40" />
          <p>Hisoblash uchun buyurtma ma'lumotlari kerak</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {(['A', 'B', 'C'] as const).map((cat) => {
              const count = data.summary[cat];
              const catItems = data.items.filter((i) => i.category === cat);
              const revenue = catItems.reduce((s, i) => s + Number(i.revenue), 0);
              return (
                <div key={cat} onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
                  className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${filterCat === cat ? 'border-violet-400 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                  style={{ borderLeftWidth: 4, borderLeftColor: CAT_COLORS[cat] }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black" style={{ color: CAT_COLORS[cat] }}>Kategoriya {cat}</span>
                    <span className="text-sm font-semibold text-gray-500">{count} ta</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatMoney(revenue)} so'm</div>
                  <div className="text-sm text-gray-500 mt-0.5">{Math.round((revenue / data.total) * 100)}% daromad</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {cat === 'A' ? '0–80% kumulyativ (eng muhim)' : cat === 'B' ? '80–95% kumulyativ' : '95–100% (kam muhim)'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['abc', 'recommendations'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                {t === 'abc' ? 'ABC Jadval' : `Tavsiyalar ${recs.length > 0 ? `(${recs.length})` : ''}`}
              </button>
            ))}
          </div>

          {tab === 'abc' && (
            <>
              {/* Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Top 20 mahsulot (daromad bo'yicha)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => formatMoney(v) + " so'm"} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={CAT_COLORS[entry.category as 'A' | 'B' | 'C']} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {(['A', 'B', 'C'] as const).map((c) => (
                    <div key={c} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAT_COLORS[c] }} />
                      Kategoriya {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">{filteredItems.length} ta mahsulot</h3>
                  <div className="flex gap-1">
                    {(['all', 'A', 'B', 'C'] as const).map((f) => (
                      <button key={f} onClick={() => setFilterCat(f)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${filterCat === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {f === 'all' ? 'Barchasi' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Kategoriya</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Daromad</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Daromad %</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Kumulyativ %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.product?.name ?? item.productId}</div>
                          {item.product?.sku && <div className="text-xs text-gray-400">{item.product.sku}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-black px-2.5 py-0.5 rounded-full" style={{ backgroundColor: CAT_COLORS[item.category] + '20', color: CAT_COLORS[item.category] }}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(item.revenue)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{(item.revenueShare * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${item.cumulative * 100}%`, backgroundColor: CAT_COLORS[item.category] }} />
                            </div>
                            <span className="text-gray-600 text-xs w-10 text-right">{(item.cumulative * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'recommendations' && (
            <div className="space-y-4">
              {recs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <TrendingUp className="h-10 w-10 mb-2 opacity-40" /><p>Hozircha tavsiyalar yo'q</p>
                </div>
              ) : recs.map((rec, i) => (
                <div key={i} className={`border rounded-2xl p-5 ${PRIORITY_COLORS[rec.priority] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wide">{rec.priority}</span>
                        <span className="text-xs opacity-70">·</span>
                        <span className="text-xs font-semibold">{TYPE_LABELS[rec.type] ?? rec.type}</span>
                      </div>
                      <p className="text-sm font-semibold">{rec.message}</p>
                      {rec.products?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {rec.products.slice(0, 8).map((p) => (
                            <span key={p.id} className="text-xs bg-white/60 px-2 py-0.5 rounded-full border border-current/20">{p.name}</span>
                          ))}
                          {rec.products.length > 8 && <span className="text-xs opacity-60">+{rec.products.length - 8} ta</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
