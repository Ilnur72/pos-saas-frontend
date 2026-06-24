import { useState, useEffect } from 'react';
import { Plus, X, Zap, Check, PackageCheck, Trash2, Search } from 'lucide-react';
import { purchaseOrdersApi, suppliersApi, productsApi } from '@/api/tenant.api';

interface PO {
  id: string; orderNumber: string; status: string; createdAt: string;
  note?: string; expectedDelivery?: string;
  supplier: { id: string; name: string; phone?: string };
  items: POItem[];
}
interface POItem {
  id: string; productId: string; requestedQty: number; receivedQty?: number; unitCost: number; note?: string;
  product: { id: string; name: string; sku: string };
}
interface AutoRule { id: string; triggerQty: number; orderQty: number; isActive: boolean; product?: { id: string; name: string; sku: string }; supplier: { id: string; name: string } }
interface Meta { total: number; totalPages: number; page: number }

const PO_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', SENT: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700', RECEIVED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};
const PO_LABELS: Record<string, string> = { DRAFT: 'Qoralama', SENT: 'Yuborildi', CONFIRMED: 'Tasdiqlandi', RECEIVED: 'Qabul qilindi', CANCELLED: 'Bekor' };

type TabType = 'orders' | 'rules';

export default function PurchaseOrdersPage() {
  const [tab, setTab] = useState<TabType>('orders');
  const [pos, setPos] = useState<PO[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, totalPages: 1, page: 1 });
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PO | null>(null);
  const [receiveMode, setReceiveMode] = useState(false);
  const [receiveItems, setReceiveItems] = useState<{ itemId: string; receivedQty: number; unitCost: number }[]>([]);

  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; basePrice: number }[]>([]);

  const [createModal, setCreateModal] = useState(false);
  const [ruleModal, setRuleModal] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: '', note: '', expectedDelivery: '', items: [] as { productId: string; requestedQty: number; unitCost: number }[] });
  const [ruleForm, setRuleForm] = useState({ productId: '', supplierId: '', triggerQty: '', orderQty: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [autoGenLoading, setAutoGenLoading] = useState(false);

  const loadPos = async () => {
    setLoading(true);
    try {
      const r = await purchaseOrdersApi.getAll({ page, limit: 20, status: statusFilter || undefined });
      setPos(r.data ?? []);
      setMeta(r.meta ?? { total: 0, totalPages: 1, page: 1 });
    } catch { setPos([]); } finally { setLoading(false); }
  };

  const loadRules = async () => {
    try { const r = await purchaseOrdersApi.getRules(); setRules(Array.isArray(r) ? r : r.data ?? []); } catch { setRules([]); }
  };

  useEffect(() => {
    suppliersApi.getAll().then((r: any) => setSuppliers(Array.isArray(r) ? r : r.data ?? [])).catch(() => {});
    productsApi.getAll({ limit: 200 }).then((r: any) => setProducts(r.data ?? r)).catch(() => {});
  }, []);

  useEffect(() => { if (tab === 'orders') loadPos(); else loadRules(); }, [tab, page, statusFilter]);

  const handleAutoGenerate = async () => {
    setAutoGenLoading(true);
    try {
      const r = await purchaseOrdersApi.autoGenerate();
      alert(`${r.created} ta yangi zakaz yaratildi`);
      loadPos();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Xatolik');
    } finally { setAutoGenLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try { await purchaseOrdersApi.approve(id); setDetail(null); loadPos(); } catch (e: any) { alert(e.response?.data?.message ?? 'Xatolik'); }
  };

  const startReceive = (po: PO) => {
    setReceiveItems(po.items.map((i) => ({ itemId: i.id, receivedQty: i.requestedQty, unitCost: Number(i.unitCost) })));
    setReceiveMode(true);
  };

  const handleReceive = async () => {
    if (!detail) return;
    try {
      await purchaseOrdersApi.receive(detail.id, receiveItems);
      setReceiveMode(false);
      setDetail(null);
      loadPos();
    } catch (e: any) { alert(e.response?.data?.message ?? 'Xatolik'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Zakazni bekor qilishni tasdiqlaysizmi?')) return;
    try { await purchaseOrdersApi.cancel(id); setDetail(null); loadPos(); } catch (e: any) { alert(e.response?.data?.message ?? 'Xatolik'); }
  };

  const addPoItem = () => setPoForm((f) => ({ ...f, items: [...f.items, { productId: '', requestedQty: 1, unitCost: 0 }] }));
  const removePoItem = (i: number) => setPoForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updatePoItem = (i: number, key: string, val: unknown) => setPoForm((f) => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item),
  }));

  const handleCreatePo = async () => {
    setSaving(true); setFormError('');
    try {
      await purchaseOrdersApi.create({
        supplierId: poForm.supplierId,
        note: poForm.note || undefined,
        expectedDelivery: poForm.expectedDelivery || undefined,
        items: poForm.items.map((i) => ({ ...i, requestedQty: Number(i.requestedQty), unitCost: Number(i.unitCost) })),
      });
      setCreateModal(false);
      setPoForm({ supplierId: '', note: '', expectedDelivery: '', items: [] });
      loadPos();
    } catch (e: any) { setFormError(e.response?.data?.message ?? 'Xatolik'); } finally { setSaving(false); }
  };

  const handleCreateRule = async () => {
    setSaving(true); setFormError('');
    try {
      await purchaseOrdersApi.createRule({
        productId: ruleForm.productId || undefined,
        supplierId: ruleForm.supplierId,
        triggerQty: Number(ruleForm.triggerQty),
        orderQty: Number(ruleForm.orderQty),
      });
      setRuleModal(false);
      setRuleForm({ productId: '', supplierId: '', triggerQty: '', orderQty: '' });
      loadRules();
    } catch (e: any) { setFormError(e.response?.data?.message ?? 'Xatolik'); } finally { setSaving(false); }
  };

  const handleToggleRule = async (rule: AutoRule) => {
    try { await purchaseOrdersApi.updateRule(rule.id, { isActive: !rule.isActive }); loadRules(); } catch { /* ignore */ }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Qoidani o\'chirishni tasdiqlaysizmi?')) return;
    try { await purchaseOrdersApi.deleteRule(id); loadRules(); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zakaz boshqaruvi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Yetkazib beruvchilarga zakazlar va avtomatik qoidalar</p>
        </div>
        <div className="flex gap-2">
          {tab === 'orders' && (
            <>
              <button onClick={handleAutoGenerate} disabled={autoGenLoading}
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
                <Zap className="h-4 w-4" /> {autoGenLoading ? 'Tekshirilmoqda...' : 'Avtomatik yaratish'}
              </button>
              <button onClick={() => { setFormError(''); setCreateModal(true); }}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Yangi zakaz
              </button>
            </>
          )}
          {tab === 'rules' && (
            <button onClick={() => { setFormError(''); setRuleModal(true); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> Yangi qoida
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['orders', 'rules'] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'orders' ? 'Zakazlar' : 'Avtomatik qoidalar'}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          <div className="flex gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Barcha holat</option>
              {Object.entries(PO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
            ) : pos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <PackageCheck className="h-10 w-10 mb-2 opacity-40" /><p>Zakazlar yo'q</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Zakaz №</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Yetkazib beruvchi</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Mahsulotlar</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sana</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setDetail(po); setReceiveMode(false); }}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-violet-700">{po.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{po.supplier.name}</div>
                        {po.supplier.phone && <div className="text-xs text-gray-400">{po.supplier.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PO_COLORS[po.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {PO_LABELS[po.status] ?? po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-semibold">{po.items?.length ?? 0} ta</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(po.createdAt).toLocaleDateString('uz-UZ')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {po.status === 'DRAFT' && (
                            <button onClick={() => handleApprove(po.id)}
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold">
                              Tasdiqlash
                            </button>
                          )}
                          {['SENT', 'CONFIRMED'].includes(po.status) && (
                            <button onClick={() => { setDetail(po); startReceive(po); }}
                              className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-semibold">
                              Qabul
                            </button>
                          )}
                          {!['RECEIVED', 'CANCELLED'].includes(po.status) && (
                            <button onClick={() => handleCancel(po.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        </>
      )}

      {tab === 'rules' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Zap className="h-10 w-10 mb-2 opacity-40" /><p>Avtomatik qoidalar yo'q</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Yetkazib beruvchi</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Trigger daraja</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Zakaz miqdori</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {r.product ? (
                        <div><div className="font-medium text-gray-900">{r.product.name}</div><div className="text-xs text-gray-400">{r.product.sku}</div></div>
                      ) : <span className="text-gray-400 italic">Barcha mahsulotlar</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.supplier.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">{r.triggerQty} dona</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{r.orderQty} dona</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleRule(r)} className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${r.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {r.isActive ? 'Aktiv' : 'Nofaol'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PO Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">{detail.orderNumber}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PO_COLORS[detail.status]}`}>{PO_LABELS[detail.status]}</span>
              </div>
              <button onClick={() => { setDetail(null); setReceiveMode(false); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700">{detail.supplier.name}</p>
                {detail.supplier.phone && <p className="text-xs text-gray-500">{detail.supplier.phone}</p>}
                {detail.expectedDelivery && <p className="text-xs text-gray-500 mt-1">Kutilgan sana: {new Date(detail.expectedDelivery).toLocaleDateString('uz-UZ')}</p>}
                {detail.note && <p className="text-xs text-gray-500 mt-1">{detail.note}</p>}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Mahsulotlar</h4>
                <div className="space-y-2">
                  {detail.items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-xs text-gray-400">{item.product.sku}</div>
                      </div>
                      {receiveMode ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={receiveItems[idx]?.receivedQty ?? item.requestedQty}
                            onChange={(e) => setReceiveItems((r) => r.map((ri, i) => i === idx ? { ...ri, receivedQty: Number(e.target.value) } : ri))}
                            className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                          <span className="text-xs text-gray-400">/ {item.requestedQty}</span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{item.requestedQty} dona</div>
                          {item.receivedQty != null && <div className="text-xs text-green-600">Qabul: {item.receivedQty}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {receiveMode ? (
                  <>
                    <button onClick={() => setReceiveMode(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                    <button onClick={handleReceive} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" /> Qabul qilish
                    </button>
                  </>
                ) : (
                  <>
                    {detail.status === 'DRAFT' && (
                      <button onClick={() => handleApprove(detail.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                        Tasdiqlash
                      </button>
                    )}
                    {['SENT', 'CONFIRMED'].includes(detail.status) && (
                      <button onClick={() => startReceive(detail)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                        Mahsulot qabul qilish
                      </button>
                    )}
                    {!['RECEIVED', 'CANCELLED'].includes(detail.status) && (
                      <button onClick={() => handleCancel(detail.id)} className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold">
                        Bekor qilish
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Yangi zakaz</h2>
              <button onClick={() => setCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yetkazib beruvchi *</label>
                <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Tanlang...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kutilgan sana</label>
                <input type="date" value={poForm.expectedDelivery} onChange={(e) => setPoForm({ ...poForm, expectedDelivery: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Mahsulotlar</label>
                  <button onClick={addPoItem} className="text-xs text-violet-600 hover:text-violet-800 font-semibold">+ Qo'shish</button>
                </div>
                <div className="space-y-2">
                  {poForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select value={item.productId} onChange={(e) => updatePoItem(idx, 'productId', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500">
                          <option value="">Mahsulot...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <input type="number" min="1" value={item.requestedQty} onChange={(e) => updatePoItem(idx, 'requestedQty', Number(e.target.value))}
                        placeholder="Miqdor" className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      <input type="number" min="0" value={item.unitCost} onChange={(e) => updatePoItem(idx, 'unitCost', Number(e.target.value))}
                        placeholder="Narx" className="w-24 border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      <button onClick={() => removePoItem(idx)} className="p-2 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {poForm.items.length === 0 && <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">Mahsulot qo'shing</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
                <input value={poForm.note} onChange={(e) => setPoForm({ ...poForm, note: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setCreateModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handleCreatePo} disabled={saving || !poForm.supplierId || !poForm.items.length}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Yaratilmoqda...' : 'Zakaz yaratish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {ruleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Yangi avtomatik qoida</h2>
              <button onClick={() => setRuleModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mahsulot (ixtiyoriy)</label>
                <select value={ruleForm.productId} onChange={(e) => setRuleForm({ ...ruleForm, productId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Barcha mahsulotlar</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yetkazib beruvchi *</label>
                <select value={ruleForm.supplierId} onChange={(e) => setRuleForm({ ...ruleForm, supplierId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Tanlang...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trigger daraja (dona) *</label>
                  <input type="number" min="1" value={ruleForm.triggerQty} onChange={(e) => setRuleForm({ ...ruleForm, triggerQty: e.target.value })}
                    placeholder="10" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zakaz miqdori (dona) *</label>
                  <input type="number" min="1" value={ruleForm.orderQty} onChange={(e) => setRuleForm({ ...ruleForm, orderQty: e.target.value })}
                    placeholder="50" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRuleModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handleCreateRule} disabled={saving || !ruleForm.supplierId || !ruleForm.triggerQty || !ruleForm.orderQty}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
