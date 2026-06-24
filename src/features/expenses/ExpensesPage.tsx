import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Receipt, TrendingDown, Home, Briefcase, Lightbulb, ShoppingCart, FileText, Truck, MoreHorizontal } from 'lucide-react';
import { expensesApi } from '@/api/tenant.api';

type ExpenseCategory = 'RENT' | 'SALARY' | 'UTILITY' | 'PURCHASE' | 'TAX' | 'TRANSPORT' | 'OTHER';

interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  paidVia: string;
  sessionId?: string;
  createdBy: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: 'Ijara',
  SALARY: 'Oylik',
  UTILITY: 'Kommunal',
  PURCHASE: 'Xarid',
  TAX: 'Soliq',
  TRANSPORT: 'Transport',
  OTHER: 'Boshqa',
};

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  RENT: Home,
  SALARY: Briefcase,
  UTILITY: Lightbulb,
  PURCHASE: ShoppingCart,
  TAX: FileText,
  TRANSPORT: Truck,
  OTHER: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  RENT: 'bg-blue-50 text-blue-700 border-blue-200',
  SALARY: 'bg-violet-50 text-violet-700 border-violet-200',
  UTILITY: 'bg-amber-50 text-amber-700 border-amber-200',
  PURCHASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TAX: 'bg-red-50 text-red-700 border-red-200',
  TRANSPORT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
};

const PAID_VIA_LABELS: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', TRANSFER: 'O\'tkazma' };

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"; }

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{ totalAmount: number; byCategory: { category: string; amount: number }[] }>({ totalAmount: 0, byCategory: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Partial<Expense> | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<{ category?: ExpenseCategory; from: string; to: string }>({ from: startOfMonth(), to: endOfMonth() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await expensesApi.getAll({
        ...(filter.category && { category: filter.category }),
        from: filter.from,
        to: filter.to + 'T23:59:59',
        limit: 100,
      });
      setExpenses(r.data ?? r);
      setSummary(r.summary ?? { totalAmount: 0, byCategory: [] });
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setModal({ open: true, editing: { category: 'OTHER', paidVia: 'CASH', amount: 0 } });
  const openEdit = (e: Expense) => setModal({ open: true, editing: { ...e } });
  const close = () => { setModal({ open: false, editing: null }); setError(''); };

  const save = async () => {
    if (!modal.editing) return;
    if (!modal.editing.amount || modal.editing.amount <= 0) { setError('Summa musbat bo\'lishi kerak'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        category: modal.editing.category,
        amount: Number(modal.editing.amount),
        note: modal.editing.note,
        paidVia: modal.editing.paidVia ?? 'CASH',
      };
      if (modal.editing.id) {
        await expensesApi.update(modal.editing.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      close();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Chiqimni o\'chirasizmi?')) return;
    try { await expensesApi.remove(id); load(); } catch { /* ignore */ }
  };

  const ed = modal.editing;
  const set = (k: string, v: unknown) => setModal((m) => ({ ...m, editing: { ...m.editing, [k]: v } }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chiqimlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ijara, oylik, kommunal va boshqa xarajatlar</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Chiqim qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Boshlanish</label>
            <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tugash</label>
            <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Kategoriya</label>
            <select value={filter.category ?? ''} onChange={(e) => setFilter((f) => ({ ...f, category: (e.target.value || undefined) as any }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Hammasi</option>
              {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600 font-semibold mb-0.5">Davr bo'yicha jami</p>
              <p className="text-xl font-bold text-red-700">{fmt(summary.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {summary.byCategory.map((c) => {
            const cat = c.category as ExpenseCategory;
            const Icon = CATEGORY_ICONS[cat] ?? MoreHorizontal;
            return (
              <div key={c.category} className={`rounded-2xl border p-3 ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.OTHER}`}>
                <Icon className="h-4 w-4 mb-1.5 opacity-70" />
                <p className="text-[10px] font-semibold uppercase opacity-70">{CATEGORY_LABELS[cat]}</p>
                <p className="text-sm font-bold mt-0.5">{fmt(c.amount)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yuklanmoqda...</div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Receipt className="h-10 w-10 opacity-30" />
            <p className="text-sm">Bu davrda chiqim yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sana</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategoriya</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Izoh</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">To'lov turi</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Summa</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((e) => {
                const cat = e.category;
                const Icon = CATEGORY_ICONS[cat] ?? MoreHorizontal;
                return (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(e.createdAt).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.OTHER}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {CATEGORY_LABELS[cat]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{e.note || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">{PAID_VIA_LABELS[e.paidVia] ?? e.paidVia}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-red-700">{fmt(Number(e.amount))}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal.open && ed && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold">{ed.id ? 'Chiqim tahrirlash' : 'Yangi chiqim'}</h2>
              </div>
              <button onClick={close} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategoriya *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => {
                    const Icon = CATEGORY_ICONS[c];
                    const active = ed.category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set('category', c)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${active ? `${CATEGORY_COLORS[c]} border-current` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                        <Icon className="h-4 w-4" />
                        {CATEGORY_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Summa (so'm) *</label>
                <input
                  type="number"
                  value={ed.amount ?? 0}
                  onChange={(e) => set('amount', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">To'lov turi</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'CARD', 'TRANSFER'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('paidVia', v)}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 ${ed.paidVia === v ? 'bg-violet-50 text-violet-700 border-violet-400' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      {PAID_VIA_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
                <textarea
                  rows={2}
                  value={ed.note ?? ''}
                  onChange={(e) => set('note', e.target.value)}
                  placeholder="Masalan: Yanvar oyi ijarasi"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={close} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor qilish</button>
                <button onClick={save} disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
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
