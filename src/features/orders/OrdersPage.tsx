import { useState, useEffect } from 'react';
import { Plus, Search, X, ShoppingCart, Trash2, ChevronDown } from 'lucide-react';
import { ordersApi, productsApi } from '@/api/tenant.api';

interface OrderItem { productId: string; name: string; sku: string; basePrice: number; salePrice?: number; qty: number }
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string;
  customerName: string; customerPhone: string; subtotal: number; totalAmount: number;
  createdAt: string; items: any[];
}
interface Meta { total: number; page: number; totalPages: number }

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-50 text-yellow-700',
  CONFIRMED:  'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700',
  SHIPPED:    'bg-purple-50 text-purple-700',
  DELIVERED:  'bg-green-50 text-green-700',
  CANCELLED:  'bg-red-50 text-red-700',
  REFUNDED:   'bg-gray-100 text-gray-600',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlandi', PROCESSING: 'Jarayonda',
  SHIPPED: 'Yuborildi', DELIVERED: 'Yetkazildi', CANCELLED: 'Bekor', REFUNDED: 'Qaytarildi',
};
const PAY_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-50 text-red-700', PAID: 'bg-green-50 text-green-700', PARTIAL: 'bg-yellow-50 text-yellow-700',
};
const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED',
};
const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Tasdiqlash', CONFIRMED: 'Jarayonga olish', PROCESSING: 'Yuborish', SHIPPED: 'Yetkazildi',
};

function formatMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; sku: string; basePrice: number; salePrice?: number }[]>([]);

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', paymentMethod: 'CASH', deliveryMethod: 'PICKUP', note: '',
  });
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await ordersApi.getAll({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });
      setOrders(r.data ?? []);
      setMeta(r.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch { setOrders([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search, statusFilter]);
  useEffect(() => {
    productsApi.getAll({ limit: 200 }).then((r) => setAllProducts(r.data ?? r)).catch(() => {});
  }, []);

  const filteredProducts = productSearch
    ? allProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts.slice(0, 8);

  const addToCart = (p: typeof allProducts[0]) => {
    setCartItems((items) => {
      const existing = items.find((i) => i.productId === p.id);
      if (existing) return items.map((i) => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...items, { productId: p.id, name: p.name, sku: p.sku, basePrice: p.basePrice, salePrice: p.salePrice, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCartItems((i) => i.filter((x) => x.productId !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return removeFromCart(productId);
    setCartItems((i) => i.map((x) => x.productId === productId ? { ...x, qty } : x));
  };

  const cartTotal = cartItems.reduce((s, i) => s + (i.salePrice ?? i.basePrice) * i.qty, 0);

  const handleCreate = async () => {
    if (!form.customerName || !form.customerPhone || cartItems.length === 0) return;
    setSaving(true); setFormError('');
    try {
      await ordersApi.create({
        ...form,
        items: cartItems.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setCreating(false);
      setCartItems([]);
      setForm({ customerName: '', customerPhone: '', paymentMethod: 'CASH', deliveryMethod: 'PICKUP', note: '' });
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleAdvanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try { await ordersApi.updateStatus(order.id, next); load(); } catch { /* ignore */ }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Buyurtmani bekor qilishni tasdiqlaysizmi?')) return;
    try { await ordersApi.cancel(id); load(); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} ta buyurtma</p>
        </div>
        <button onClick={() => { setCreating(true); setFormError(''); }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yangi buyurtma
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buyurtma № yoki mijoz..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Barcha holat</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-40" /><p>Buyurtmalar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Buyurtma</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mijoz</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">To'lov</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Summa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sana</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-violet-700">{o.orderNumber}</span>
                    <div className="text-xs text-gray-400">{o.items?.length ?? 0} ta mahsulot</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{o.customerName}</div>
                    <div className="text-xs text-gray-400">{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAY_COLORS[o.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.paymentStatus === 'PAID' ? "To'landi" : o.paymentStatus === 'PARTIAL' ? 'Qisman' : "To'lanmadi"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {NEXT_STATUS[o.status] && (
                        <button onClick={() => handleAdvanceStatus(o)}
                          className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-2.5 py-1 rounded-lg font-semibold transition-colors">
                          {NEXT_LABEL[o.status]}
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(o.status) && (
                        <button onClick={() => handleCancel(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
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

      {/* Create Order Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Yangi buyurtma</h2>
              <button onClick={() => setCreating(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mijoz ismi *</label>
                  <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon *</label>
                  <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">To'lov usuli</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="CASH">Naqd</option>
                    <option value="CARD">Karta</option>
                    <option value="TRANSFER">O'tkazma</option>
                    <option value="CREDIT">Nasiya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yetkazish usuli</label>
                  <select value={form.deliveryMethod} onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="PICKUP">Olib ketish</option>
                    <option value="DELIVERY">Yetkazib berish</option>
                    <option value="COURIER">Kuryer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mahsulot qo'shish</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Mahsulot qidirish..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="text-left p-2.5 border border-gray-100 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-sm">
                      <div className="font-medium text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{new Intl.NumberFormat('uz-UZ').format(p.salePrice ?? p.basePrice)} so'm</div>
                    </button>
                  ))}
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 border-b border-gray-100">Savatcha</div>
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-b-0">
                      <span className="flex-1 text-sm font-medium text-gray-900 truncate">{item.name}</span>
                      <span className="text-xs text-gray-400">{formatMoney((item.salePrice ?? item.basePrice) * item.qty)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">-</button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="bg-violet-50 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-violet-700">Jami:</span>
                    <span className="text-lg font-bold text-violet-700">{formatMoney(cartTotal)}</span>
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setCreating(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor qilish</button>
                <button onClick={handleCreate} disabled={saving || !form.customerName || !form.customerPhone || cartItems.length === 0}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                  {saving ? 'Yaratilmoqda...' : `Buyurtma yaratish · ${formatMoney(cartTotal)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
