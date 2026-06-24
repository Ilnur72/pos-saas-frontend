import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Truck } from 'lucide-react';
import { suppliersApi } from '@/api/tenant.api';

interface Supplier {
  id: string; name: string; phone?: string; email?: string;
  address?: string; contactPerson?: string; isActive: boolean;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Partial<Supplier> | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await suppliersApi.getAll({ search: search || undefined });
      setSuppliers(Array.isArray(r) ? r : r.data ?? []);
    } catch { setSuppliers([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => setModal({ open: true, editing: { name: '', phone: '', email: '', address: '', contactPerson: '', isActive: true } });
  const openEdit = (s: Supplier) => setModal({ open: true, editing: { ...s } });
  const closeModal = () => { setModal({ open: false, editing: null }); setError(''); };

  const handleSave = async () => {
    if (!modal.editing) return;
    setSaving(true); setError('');
    try {
      const dto: Record<string, unknown> = { ...modal.editing };
      if (modal.editing.id) {
        await suppliersApi.update(modal.editing.id, dto);
      } else {
        await suppliersApi.create({
          name: modal.editing.name!,
          phone: modal.editing.phone || undefined,
          email: modal.editing.email || undefined,
          address: modal.editing.address || undefined,
          contactPerson: modal.editing.contactPerson || undefined,
        });
      }
      closeModal();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yetkazib beruvchini o\'chirishni tasdiqlaysizmi?')) return;
    try { await suppliersApi.remove(id); load(); } catch { /* ignore */ }
  };

  const ed = modal.editing;
  const set = (k: string, v: unknown) => setModal((m) => ({ ...m, editing: { ...m.editing, [k]: v } }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yetkazib beruvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} ta yetkazib beruvchi</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yangi yetkazib beruvchi
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Truck className="h-10 w-10 mb-2 opacity-40" /><p>Yetkazib beruvchilar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nomi</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefon</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Aloqachi</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.contactPerson ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Aktiv' : 'Nofaol'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && ed && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{ed.id ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomi *</label>
                <input value={ed.name ?? ''} onChange={(e) => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon</label>
                  <input value={ed.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+998..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={ed.email ?? ''} onChange={(e) => set('email', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aloqa mas'uli</label>
                <input value={ed.contactPerson ?? ''} onChange={(e) => set('contactPerson', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Manzil</label>
                <input value={ed.address ?? ''} onChange={(e) => set('address', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              {ed.id && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ed.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                  <span>Aktiv</span>
                </label>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor qilish</button>
                <button onClick={handleSave} disabled={saving || !ed.name}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
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
