import { useState, useEffect, useCallback } from 'react';
import { Users, Award, AlertTriangle, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { reportsApi, tenantApi } from '@/api/tenant.api';

interface CashierStat {
  cashierId: string;
  sessionsCount: number;
  totalSales: number;
  totalOrders: number;
  totalCash: number;
  totalCard: number;
  totalQr: number;
  totalShortage: number;
  totalSurplus: number;
  shortageSessions: number;
  avgSessionHours: number;
  avgCheck: number;
  shortageRate: number;
}

interface Session {
  id: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  status: string;
  totalSales: number;
  ordersCount: number;
  expectedCash?: number;
  closingCash?: number;
  difference?: number;
}

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"; }
function startOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function CashierPerformancePage() {
  const [cashiers, setCashiers] = useState<CashierStat[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName?: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ from: string; to: string }>({ from: startOfMonth(), to: today() });

  const userMap = new Map(users.map((u) => [u.id, u.fullName || u.email]));
  const getName = (id: string) => userMap.get(id) ?? id.slice(0, 8);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [perf, allUsers] = await Promise.all([
        reportsApi.getCashierPerformance(filter.from, filter.to + 'T23:59:59'),
        tenantApi.getUsers().catch(() => []),
      ]);
      setCashiers(perf.cashiers ?? []);
      setSessions(perf.sessions ?? []);
      setUsers(Array.isArray(allUsers) ? allUsers : allUsers.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setQuick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilter({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  };

  const topCashier = cashiers[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kassirlar samaradorligi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sotuv, kamomad, smena statistikasi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setQuick(7)} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">7 kun</button>
            <button onClick={() => setQuick(30)} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">30 kun</button>
            <button onClick={() => setFilter({ from: startOfMonth(), to: today() })} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white">Bu oy</button>
          </div>
          <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Yuklanmoqda...</div>
      ) : cashiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
          <Users className="h-12 w-12 opacity-30" />
          <p>Bu davrda smena yo'q</p>
        </div>
      ) : (
        <>
          {/* Eng yaxshi kassir */}
          {topCashier && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Eng ko'p sotgan kassir</span>
              </div>
              <p className="text-2xl font-black mb-1">{getName(topCashier.cashierId)}</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p className="text-xs opacity-80">Sotuv</p>
                  <p className="text-lg font-bold">{fmt(topCashier.totalSales)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80">Smenalar</p>
                  <p className="text-lg font-bold">{topCashier.sessionsCount}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80">O'rta chek</p>
                  <p className="text-lg font-bold">{fmt(topCashier.avgCheck)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Kassirlar jadvali */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">{cashiers.length} ta kassir</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Kassir</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Smenalar</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Sotuv</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Buyurtma</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">O'rta chek</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">O'rta soat</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Kamomad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cashiers.map((c) => (
                  <tr key={c.cashierId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{getName(c.cashierId)}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.sessionsCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(c.totalSales)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(c.avgCheck)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.avgSessionHours} soat</td>
                    <td className="px-4 py-3 text-right">
                      {c.totalShortage > 0 ? (
                        <div className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-xs font-bold">{fmt(c.totalShortage)}</span>
                        </div>
                      ) : c.totalSurplus > 0 ? (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-bold">+{fmt(c.totalSurplus)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Smenalar jadvali — kamomad bo'lganlarni qizil */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700">Smenalar tarixi ({sessions.length})</h3>
              {sessions.filter((s) => Number(s.difference ?? 0) < 0).length > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {sessions.filter((s) => Number(s.difference ?? 0) < 0).length} ta kamomad
                </span>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Kassir</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Ochilgan</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Yopilgan</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Sotuv</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Kutilgan</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Haqiqiy</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Farq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map((s) => {
                    const diff = Number(s.difference ?? 0);
                    const isShortage = diff < 0;
                    return (
                      <tr key={s.id} className={isShortage ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{getName(s.openedBy)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(s.openedAt).toLocaleString('uz-UZ')}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{s.closedAt ? new Date(s.closedAt).toLocaleString('uz-UZ') : <span className="text-emerald-600 font-semibold">Ochiq</span>}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700 font-semibold">{fmt(Number(s.totalSales))}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{s.expectedCash != null ? fmt(Number(s.expectedCash)) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{s.closingCash != null ? fmt(Number(s.closingCash)) : '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          {s.difference != null ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              diff === 0 ? 'bg-emerald-100 text-emerald-700' :
                              diff > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {diff > 0 ? '+' : ''}{fmt(diff)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
