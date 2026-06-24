import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, Package, Upload, Download, CheckCircle, AlertCircle, Barcode } from 'lucide-react';
import { productsApi, categoriesApi } from '@/api/tenant.api';
import { apiClient } from '@/api/client';
import BarcodePrintModal from './BarcodePrintModal';

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; sku: string; slug: string;
  barcode?: string;
  costPrice?: number;
  basePrice: number; salePrice?: number; stockQty?: number;
  wholesalePrice?: number; wholesaleMinQty?: number;
  isActive: boolean; isFeatured: boolean;
  category?: Category; categoryId?: string;
  imageUrls: string[]; description?: string; minStockLevel: number;
}

const empty = (): Partial<Product> => ({ name: '', sku: '', barcode: '', costPrice: 0, basePrice: 0, wholesaleMinQty: 0, isActive: true, isFeatured: false, minStockLevel: 0, imageUrls: [] });

function formatMoney(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Partial<Product> | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOpts, setImportOpts] = useState({ updateExisting: false, skipErrors: true });
  const [importResult, setImportResult] = useState<{ total: number; success: number; created: number; updated: number; errors: { row: number; field: string; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [barcodeModal, setBarcodeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await productsApi.getAll({ page, limit, search: search || undefined });
      setProducts(r.data ?? r);
      setTotal(r.meta?.total ?? (r.data ?? r).length);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { categoriesApi.getAll().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { load(); }, [page, search]);

  const openCreate = () => setModal({ open: true, editing: empty() });
  const openEdit = (p: Product) => setModal({ open: true, editing: { ...p } });
  const closeModal = () => { setModal({ open: false, editing: null }); setError(''); };

  const handleSave = async () => {
    if (!modal.editing) return;
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...modal.editing };
      if (payload.basePrice) payload.basePrice = Number(payload.basePrice);
      if (payload.salePrice) payload.salePrice = Number(payload.salePrice);
      if (payload.costPrice != null) payload.costPrice = Number(payload.costPrice);
      if (payload.wholesalePrice) payload.wholesalePrice = Number(payload.wholesalePrice);
      if (payload.wholesaleMinQty != null) payload.wholesaleMinQty = Number(payload.wholesaleMinQty);
      if (payload.minStockLevel) payload.minStockLevel = Number(payload.minStockLevel);

      if (modal.editing.id) {
        await productsApi.update(modal.editing.id, payload);
      } else {
        await productsApi.create(payload);
      }
      closeModal();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await productsApi.remove(id);
      load();
    } catch { /* ignore */ }
  };

  const ed = modal.editing;
  const set = (k: string, v: unknown) => setModal((m) => ({ ...m, editing: { ...m.editing, [k]: v } }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} ta mahsulot</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBarcodeModal(true)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <Barcode className="h-4 w-4" /> Barcode
          </button>
          <button onClick={() => { setImportResult(null); setImportFile(null); setImportModal(true); }}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Yangi mahsulot
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Nomi yoki SKU bo'yicha qidirish..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Yuklanmoqda...</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Package className="h-10 w-10 mb-2 opacity-40" />
            <p>Mahsulotlar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategoriya</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Narx</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Holat</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="h-9 w-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div className="text-gray-500">{p.sku}</div>
                    {p.barcode && <div className="text-gray-400 text-[11px]">{p.barcode}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? <Badge label={p.category.name} color="bg-blue-50 text-blue-700" /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(p.salePrice ?? p.basePrice)}</div>
                    {p.salePrice && <div className="text-xs text-gray-400 line-through">{formatMoney(p.basePrice)}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge label={p.isActive ? 'Aktiv' : 'Nofaol'} color={p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">← Oldingi</button>
          <span className="text-sm text-gray-500">{page} / {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Keyingi →</button>
        </div>
      )}

      {modal.open && ed && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{ed.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomi *</label>
                <input value={ed.name ?? ''} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU</label>
                  <input value={ed.sku ?? ''} onChange={(e) => set('sku', e.target.value)} placeholder="Avtomatik" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategoriya</label>
                  <select value={ed.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">Tanlanmagan</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shtrix-kod (EAN-13)</label>
                <input
                  value={ed.barcode ?? ''}
                  onChange={(e) => set('barcode', e.target.value || null)}
                  placeholder="Skanerlang yoki qo'lda kiriting"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tannarx (so'm)</label>
                  <input type="number" value={ed.costPrice ?? 0} onChange={(e) => set('costPrice', e.target.value)} placeholder="Sotib olish narxi" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <p className="text-[10px] text-gray-400 mt-1">Foyda hisobi uchun</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asosiy narx *</label>
                  <input type="number" value={ed.basePrice ?? 0} onChange={(e) => set('basePrice', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sotuv narxi</label>
                  <input type="number" value={ed.salePrice ?? ''} onChange={(e) => set('salePrice', e.target.value || null)} placeholder="=Asosiy" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              {/* Optom narxi */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-700 mb-2">📦 Optom narxi (ko'p miqdorda sotish uchun)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Optom narxi (so'm)</label>
                    <input
                      type="number"
                      value={ed.wholesalePrice ?? ''}
                      onChange={(e) => set('wholesalePrice', e.target.value || null)}
                      placeholder="Masalan: 80,000"
                      className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Minimal miqdor (donadan)</label>
                    <input
                      type="number"
                      value={ed.wholesaleMinQty ?? 0}
                      onChange={(e) => set('wholesaleMinQty', e.target.value)}
                      placeholder="Masalan: 10"
                      className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-600 mt-1.5">
                  Kassada mahsulot soni minimal miqdorga yetganda avtomatik optom narx qo'llaniladi
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Minimum stok darajasi</label>
                <input type="number" value={ed.minStockLevel ?? 0} onChange={(e) => set('minStockLevel', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tavsif</label>
                <textarea rows={2} value={ed.description ?? ''} onChange={(e) => set('description', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ed.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                  <span>Aktiv</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ed.isFeatured ?? false} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded" />
                  <span>Featured</span>
                </label>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor qilish</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {barcodeModal && <BarcodePrintModal onClose={() => { setBarcodeModal(false); load(); }} />}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Mahsulotlarni import qilish</h2>
              <button onClick={() => setImportModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!importResult ? (
                <>
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    {importFile ? (
                      <p className="text-sm font-semibold text-violet-700">{importFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">Fayl yuklash yoki bu yerga tashlash</p>
                        <p className="text-xs text-gray-400 mt-1">xlsx, xls, csv — max 10MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setImportFile(f); }} />
                  </div>

                  <a href="/api/v1/products/import/template" download className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-semibold">
                    <Download className="h-4 w-4" /> Namuna shablon yuklab olish
                  </a>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={importOpts.updateExisting} onChange={(e) => setImportOpts({ ...importOpts, updateExisting: e.target.checked })} className="rounded" />
                      <span>Mavjud mahsulotlarni yangilash (SKU bo'yicha)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={importOpts.skipErrors} onChange={(e) => setImportOpts({ ...importOpts, skipErrors: e.target.checked })} className="rounded" />
                      <span>Xatolarda davom etish</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setImportModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor qilish</button>
                    <button
                      disabled={!importFile || importing}
                      onClick={async () => {
                        if (!importFile) return;
                        setImporting(true);
                        const formData = new FormData();
                        formData.append('file', importFile);
                        formData.append('updateExisting', String(importOpts.updateExisting));
                        formData.append('skipErrors', String(importOpts.skipErrors));
                        try {
                          const r = await apiClient.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setImportResult(r.data);
                          load();
                        } catch (e: any) {
                          alert(e.response?.data?.message ?? 'Xatolik yuz berdi');
                        } finally { setImporting(false); }
                      }}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                      {importing ? 'Yuklanmoqda...' : 'Import qilish'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Jami qatorlar</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{importResult.created}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Yaratildi</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{importResult.updated}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Yangilandi</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2">
                        <AlertCircle className="h-4 w-4" /> {importResult.errors.length} ta xato
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 20).map((e, i) => (
                          <div key={i} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                            Qator {e.row}: {e.field && `[${e.field}] `}{e.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.errors.length === 0 && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-semibold">Import muvaffaqiyatli yakunlandi!</span>
                    </div>
                  )}

                  <button onClick={() => setImportModal(false)} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Yopish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
