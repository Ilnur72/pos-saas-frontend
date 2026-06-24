import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Tag, Clock } from 'lucide-react';
import { priceRulesApi, productsApi } from '@/api/tenant.api';

interface PriceRule {
  id: string; name: string; type: string; target: string; targetId?: string;
  value: number; direction: string; minQty?: number; startDate?: string; endDate?: string;
  priority: number; isActive: boolean; stackable: boolean;
  products?: { id: string; name: string; sku: string }[];
}
interface Preview { id: string; name: string; sku: string; originalPrice: number; finalPrice: number; discount: number; discountPct: number }

const TYPE_LABELS: Record<string, string> = { PERCENT: 'Foizli', FIXED: 'Summali', SPECIAL_PRICE: 'Sotuv narxi' };
const TARGET_LABELS: Record<string, string> = { ALL: 'Barcha', CATEGORY: 'Kategoriya', PRODUCT: 'Mahsulot', CUSTOMER_GROUP: 'Mijoz guruhi' };
const DIRECTION_LABELS: Record<string, string> = { DECREASE: "Chegirma", INCREASE: "Ustama" };

function formatMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

const emptyRule = (): Partial<PriceRule> => ({ name: '', type: 'PERCENT', target: 'ALL', direction: 'DECREASE', value: 10, priority: 0, isActive: true, stackable: false });

export default function PriceRulesPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Partial<PriceRule> | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewModal, setPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<Preview[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [selectedRuleForPreview, setSelectedRuleForPreview] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await priceRulesApi.getAll();
      setRules(Array.isArray(r) ? r : r.data ?? []);
    } catch { setRules([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); productsApi.getAll({ limit: 200 }).then((r: any) => setProducts(r.data ?? r)).catch(() => {}); }, []);

  const openCreate = () => setModal({ open: true, editing: emptyRule() });
  const openEdit = (r: PriceRule) => setModal({ open: true, editing: { ...r } });
  const closeModal = () => { setModal({ open: false, editing: null }); setError(''); };

  const handleSave = async () => {
    if (!modal.editing) return;
    setSaving(true); setError('');
    try {
      const dto: any = { ...modal.editing, value: Number(modal.editing.value), priority: Number(modal.editing.priority ?? 0) };
      delete dto.products;
      if (modal.editing.id) {
        await priceRulesApi.update(modal.editing.id, dto);
      } else {
        await priceRulesApi.create(dto);
      }
      closeModal(); load();
    } catch (e: any) { setError(e.response?.data?.message ?? 'Xatolik'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Qoidani o\'chirishni tasdiqlaysizmi?')) return;
    try { await priceRulesApi.remove(id); load(); } catch { /* ignore */ }
  };

  const handleToggle = async (rule: PriceRule) => {
    try { await priceRulesApi.update(rule.id, { isActive: !rule.isActive }); load(); } catch { /* ignore */ }
  };

  const showPreview = async (ruleId: string) => {
    setSelectedRuleForPreview(ruleId);
    setPreviewLoading(true);
    setPreviewModal(true);
    try {
      const productIds = products.slice(0, 10).map((p) => p.id);
      const r = await priceRulesApi.preview(productIds, [ruleId]);
      setPreviewData(Array.isArray(r) ? r : r.data ?? []);
    } catch { setPreviewData([]); } finally { setPreviewLoading(false); }
  };

  const ed = modal.editing;
  const set = (k: string, v: unknown) => setModal((m) => ({ ...m, editing: { ...m.editing, [k]: v } }));

  const isActive = (rule: PriceRule) => {
    const now = new Date();
    if (!rule.isActive) return false;
    if (rule.startDate && new Date(rule.startDate) > now) return false;
    if (rule.endDate && new Date(rule.endDate) < now) return false;
    return true;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Narx qoidalari</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rules.filter((r) => isActive(r)).length} ta aktiv qoida</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yangi qoida
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Tag className="h-10 w-10 mb-2 opacity-40" /><p>Narx qoidalari yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nomi</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Target</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Qiymat</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Muddat</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.stackable && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Stackable</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-gray-600">{TARGET_LABELS[r.target] ?? r.target}</td>
                  <td className="px-4 py-3 text-right font-semibold text-violet-700">
                    {DIRECTION_LABELS[r.direction]}: {r.type === 'PERCENT' ? `${r.value}%` : formatMoney(r.value)}
                  </td>
                  <td className="px-4 py-3">
                    {(r.startDate || r.endDate) ? (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {r.startDate && new Date(r.startDate).toLocaleDateString('uz-UZ')}
                        {r.startDate && r.endDate && ' – '}
                        {r.endDate && new Date(r.endDate).toLocaleDateString('uz-UZ')}
                      </div>
                    ) : <span className="text-gray-400 text-xs">Cheksiz</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(r)} className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${isActive(r) ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {isActive(r) ? 'Aktiv' : 'Nofaol'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => showPreview(r.id)} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 font-semibold">Preview</button>
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal.open && ed && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{ed.id ? 'Qoidani tahrirlash' : 'Yangi qoida'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomi *</label>
                <input value={ed.name ?? ''} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tur</label>
                  <select value={ed.type ?? 'PERCENT'} onChange={(e) => set('type', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yo'nalish</label>
                  <select value={ed.direction ?? 'DECREASE'} onChange={(e) => set('direction', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {Object.entries(DIRECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qiymat</label>
                  <input type="number" value={ed.value ?? 10} onChange={(e) => set('value', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target</label>
                  <select value={ed.target ?? 'ALL'} onChange={(e) => set('target', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {Object.entries(TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prioritet</label>
                  <input type="number" value={ed.priority ?? 0} onChange={(e) => set('priority', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Boshlanish sana</label>
                  <input type="date" value={ed.startDate ? ed.startDate.slice(0, 10) : ''} onChange={(e) => set('startDate', e.target.value || null)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tugash sana</label>
                  <input type="date" value={ed.endDate ? ed.endDate.slice(0, 10) : ''} onChange={(e) => set('endDate', e.target.value || null)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ed.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} className="rounded" /><span>Aktiv</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ed.stackable ?? false} onChange={(e) => set('stackable', e.target.checked)} className="rounded" /><span>Stackable (boshqa qoidalar bilan qo'shilsin)</span>
                </label>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handleSave} disabled={saving || !ed.name} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Narx hisoblash preview</h2>
              <button onClick={() => setPreviewModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {previewLoading ? (
                <div className="text-center text-gray-400 py-8">Hisoblanmoqda...</div>
              ) : previewData.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Ma'lumot yo'q</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Mahsulot</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Eski narx</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Yangi narx</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Chegirma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewData.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 truncate max-w-[160px]">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.sku}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-400 line-through text-xs">{formatMoney(p.originalPrice)}</td>
                        <td className="px-3 py-2 text-right font-bold text-violet-700">{formatMoney(p.finalPrice)}</td>
                        <td className="px-3 py-2 text-right text-green-600 font-semibold">-{p.discountPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
