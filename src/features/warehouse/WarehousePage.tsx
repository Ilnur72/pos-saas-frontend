import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Package, ArrowDownToLine, SlidersHorizontal, X, Warehouse } from 'lucide-react';
import { warehouseApi, productsApi, suppliersApi } from '@/api/tenant.api';

interface StockItem {
  productId: string; productName: string; sku: string;
  imageUrl?: string; totalQty: number; minStockLevel: number; isLowStock: boolean;
}
interface Transaction {
  id: string; type: string; qty: number; note?: string; createdAt: string;
  product: { name: string; sku: string };
  supplier?: { name: string };
}
interface TransMeta { total: number; page: number; totalPages: number }

type TabType = 'stock' | 'transactions';

const TX_COLORS: Record<string, string> = {
  PURCHASE:   'bg-green-50 text-green-700',
  SALE:       'bg-blue-50 text-blue-700',
  ADJUSTMENT: 'bg-yellow-50 text-yellow-700',
  RETURN:     'bg-purple-50 text-purple-700',
  TRANSFER:   'bg-gray-100 text-gray-700',
};

const TX_LABELS: Record<string, string> = {
  PURCHASE: 'Kirim', SALE: 'Sotuv', ADJUSTMENT: 'Tuzatish', RETURN: 'Qaytish', TRANSFER: "Ko'chirish",
};

export default function WarehousePage() {
  const [tab, setTab] = useState<TabType>('stock');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transMeta, setTransMeta] = useState<TransMeta>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [purchaseModal, setPurchaseModal] = useState(false);
  const [adjModal, setAdjModal] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  const [purchaseForm, setPurchaseForm] = useState({ productId: '', supplierId: '', qty: '', unitCost: '', note: '' });
  const [adjForm, setAdjForm] = useState({ productId: '', actualQty: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadStock = async () => {
    setLoading(true);
    try {
      const r = await warehouseApi.getStock({ search: search || undefined, lowStock: lowStockOnly || undefined });
      setStock(Array.isArray(r) ? r : r.data ?? []);
    } catch { setStock([]); } finally { setLoading(false); }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const r = await warehouseApi.getTransactions({ page: txPage, limit: 20 });
      setTransactions(r.data ?? []);
      setTransMeta(r.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch { setTransactions([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    productsApi.getAll({ limit: 200 }).then((r) => setProducts(r.data ?? r)).catch(() => {});
    suppliersApi.getAll().then((r) => setSuppliers(Array.isArray(r) ? r : r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => { if (tab === 'stock') loadStock(); else loadTransactions(); }, [tab, search, lowStockOnly, txPage]);

  const handlePurchase = async () => {
    if (!purchaseForm.productId || !purchaseForm.qty) return;
    setSaving(true); setFormError('');
    try {
      await warehouseApi.purchase({
        productId: purchaseForm.productId,
        qty: Number(purchaseForm.qty),
        unitCost: purchaseForm.unitCost ? Number(purchaseForm.unitCost) : undefined,
        supplierId: purchaseForm.supplierId || undefined,
        note: purchaseForm.note || undefined,
      });
      setPurchaseModal(false);
      setPurchaseForm({ productId: '', supplierId: '', qty: '', unitCost: '', note: '' });
      loadStock(); loadTransactions();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleAdjustment = async () => {
    if (!adjForm.productId || !adjForm.actualQty || !adjForm.note) return;
    setSaving(true); setFormError('');
    try {
      await warehouseApi.adjustment({ productId: adjForm.productId, actualQty: Number(adjForm.actualQty), note: adjForm.note });
      setAdjModal(false);
      setAdjForm({ productId: '', actualQty: '', note: '' });
      loadStock(); loadTransactions();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const lowCount = stock.filter((s) => s.isLowStock).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ombor</h1>
          {lowCount > 0 && (
            <p className="text-sm text-orange-600 mt-0.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />{lowCount} ta mahsulot kam stokda
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setFormError(''); setPurchaseModal(true); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <ArrowDownToLine className="h-4 w-4" /> Kirim qilish
          </button>
          <button onClick={() => { setFormError(''); setAdjModal(true); }} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <SlidersHorizontal className="h-4 w-4" /> Tuzatish
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['stock', 'transactions'] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'stock' ? 'Stok holati' : 'Harakatlar tarixi'}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomi yoki SKU..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded" />
              <span>Faqat kam stok</span>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
            ) : stock.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Warehouse className="h-10 w-10 mb-2 opacity-40" /><p>Stok ma'lumotlari yo'q</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Joriy stok</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Min. daraja</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stock.map((s) => (
                    <tr key={s.productId} className={`hover:bg-gray-50/50 transition-colors ${s.isLowStock ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt={s.productName} className="h-9 w-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{s.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.sku}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${s.isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>{s.totalQty}</span>
                        <span className="text-gray-400 ml-1 text-xs">dona</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{s.minStockLevel}</td>
                      <td className="px-4 py-3 text-center">
                        {s.isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            <AlertTriangle className="h-3 w-3" /> Kam
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Yetarli</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Warehouse className="h-10 w-10 mb-2 opacity-40" /><p>Harakatlar yo'q</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Tur</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Miqdor</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Izoh</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.product?.name}</div>
                        {t.supplier && <div className="text-xs text-gray-400">{t.supplier.name}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TX_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TX_LABELS[t.type] ?? t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${t.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.qty > 0 ? '+' : ''}{t.qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.note ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleString('uz-UZ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                  <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">← Oldingi</button>
                  <span className="text-sm text-gray-500">{txPage} / {transMeta.totalPages}</span>
                  <button disabled={txPage >= transMeta.totalPages} onClick={() => setTxPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Keyingi →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Kirim qilish</h2>
              <button onClick={() => setPurchaseModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mahsulot *</label>
                <select value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Tanlang...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yetkazib beruvchi</label>
                <select value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Tanlanmagan</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Miqdor (dona) *</label>
                  <input type="number" min="1" value={purchaseForm.qty} onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tan narx (so'm)</label>
                  <input type="number" value={purchaseForm.unitCost} onChange={(e) => setPurchaseForm({ ...purchaseForm, unitCost: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
                <input value={purchaseForm.note} onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setPurchaseModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handlePurchase} disabled={saving || !purchaseForm.productId || !purchaseForm.qty}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                  {saving ? 'Saqlanmoqda...' : 'Kirim qilish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Stok tuzatish</h2>
              <button onClick={() => setAdjModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mahsulot *</label>
                <select value={adjForm.productId} onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Tanlang...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Haqiqiy miqdor (inventarizatsiya natijasi) *</label>
                <input type="number" min="0" value={adjForm.actualQty} onChange={(e) => setAdjForm({ ...adjForm, actualQty: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh (majburiy) *</label>
                <input value={adjForm.note} onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                  placeholder="Inventarizatsiya, shikast, yo'qolish..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setAdjModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handleAdjustment} disabled={saving || !adjForm.productId || !adjForm.actualQty || !adjForm.note}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                  {saving ? 'Saqlanmoqda...' : 'Tuzatish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
