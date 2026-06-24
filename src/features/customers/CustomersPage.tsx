import { useState, useEffect } from 'react';
import { Search, Users, X, ChevronRight } from 'lucide-react';
import { customersApi } from '@/api/tenant.api';

interface Customer {
  id: string; name: string; phone: string; email?: string;
  totalOrders: number; totalSpent: number; lastOrderAt?: string;
}
interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string;
}
interface Meta { total: number; totalPages: number; page: number }

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlandi', PROCESSING: 'Jarayonda',
  SHIPPED: 'Yuborildi', DELIVERED: 'Yetkazildi', CANCELLED: 'Bekor', REFUNDED: 'Qaytarildi',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700', SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-green-50 text-green-700', CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

function formatMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, totalPages: 1, page: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await customersApi.getAll({ page, limit: 20, search: search || undefined });
      setCustomers(r.data ?? []);
      setMeta(r.meta ?? { total: 0, totalPages: 1, page: 1 });
    } catch { setCustomers([]); } finally { setLoading(false); }
  };

  const loadOrders = async (customerId: string) => {
    setOrdersLoading(true);
    try {
      const r = await customersApi.getOrders(customerId, { limit: 10 });
      setOrders(r.data ?? []);
    } catch { setOrders([]); } finally { setOrdersLoading(false); }
  };

  useEffect(() => { load(); }, [page, search]);

  const openCustomer = (c: Customer) => {
    setSelected(c);
    loadOrders(c.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} ta mijoz</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Ism, telefon yoki email..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-10 w-10 mb-2 opacity-40" /><p>Mijozlar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mijoz</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefon</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Buyurtmalar</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Jami xarid</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Oxirgi buyurtma</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openCustomer(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('uz-UZ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">← Oldingi</button>
          <span className="text-sm text-gray-500">{page} / {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Keyingi →</button>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Mijoz ma'lumotlari</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-2xl">
                  {selected.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                  <p className="text-gray-500">{selected.phone}</p>
                  {selected.email && <p className="text-sm text-gray-400">{selected.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">{selected.totalOrders}</div>
                  <div className="text-sm text-gray-500 mt-0.5">Buyurtmalar</div>
                </div>
                <div className="bg-violet-50 rounded-xl p-4">
                  <div className="text-lg font-bold text-violet-700">{formatMoney(selected.totalSpent)}</div>
                  <div className="text-sm text-gray-500 mt-0.5">Jami xarid</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">So'nggi buyurtmalar</h4>
                {ordersLoading ? (
                  <div className="text-center text-gray-400 py-6">Yuklanmoqda...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center text-gray-400 py-6">Buyurtmalar yo'q</div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="text-sm font-mono font-semibold text-violet-700">{o.orderNumber}</div>
                          <div className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatMoney(o.totalAmount)}</div>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
