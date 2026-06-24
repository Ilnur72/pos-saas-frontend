import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Printer, RefreshCw, CheckSquare, Square, Barcode, AlertCircle } from 'lucide-react';
import { productsApi } from '@/api/tenant.api';
import { generateInternalEAN13, isValidEAN13, renderEAN13SVG, printBarcodeLabels } from './barcode';

interface Product {
  id: string; name: string; sku: string; barcode?: string;
  basePrice: number; salePrice?: number;
}

interface Props { onClose: () => void }

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"; }

export default function BarcodePrintModal({ onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nobarcode'>('nobarcode');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState<Record<string, number>>({});
  const [localBarcodes, setLocalBarcodes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [genAllLoading, setGenAllLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const getBarcode = useCallback((p: Product) => localBarcodes[p.id] ?? p.barcode ?? '', [localBarcodes]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productsApi.getAll({ page: 1, limit: 500 });
      const list: Product[] = r.data ?? r;
      setProducts(list);
      const defaultQty: Record<string, number> = {};
      const initSelected = new Set<string>();
      list.forEach((p) => {
        defaultQty[p.id] = 1;
        if (!p.barcode) initSelected.add(p.id);
      });
      setQty(defaultQty);
      setSelected(initSelected);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateOne = useCallback(async (p: Product): Promise<string | null> => {
    const barcode = generateInternalEAN13();
    setGenerating((s) => new Set(s).add(p.id));
    try {
      await productsApi.update(p.id, { barcode });
      setLocalBarcodes((b) => ({ ...b, [p.id]: barcode }));
      return barcode;
    } catch {
      return null;
    } finally {
      setGenerating((s) => { const n = new Set(s); n.delete(p.id); return n; });
    }
  }, []);

  const generateAll = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenAllLoading(true);
    const noBarcode = products.filter((p) => !getBarcode(p));
    for (const p of noBarcode) {
      await generateOne(p);
      await new Promise((r) => setTimeout(r, 30)); // small gap for unique random seeds
    }
    setGenAllLoading(false);
    generatingRef.current = false;
  }, [products, getBarcode, generateOne]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    const visible = filtered.map((p) => p.id);
    const allChecked = visible.every((id) => selected.has(id));
    setSelected((s) => {
      const n = new Set(s);
      visible.forEach((id) => allChecked ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const filtered = products.filter((p) =>
    filter === 'nobarcode' ? !getBarcode(p) : true,
  );

  const readyToPrint = filtered.filter((p) => selected.has(p.id) && isValidEAN13(getBarcode(p)));

  const handlePrint = () => {
    const items = readyToPrint.map((p) => ({
      name: p.name,
      barcode: getBarcode(p),
      price: fmt(p.salePrice ?? p.basePrice),
      qty: qty[p.id] ?? 1,
    }));
    printBarcodeLabels(items);
  };

  const handlePreview = (p: Product) => {
    const bc = getBarcode(p);
    if (!isValidEAN13(bc)) return;
    setPreview(renderEAN13SVG(bc, { name: p.name, price: fmt(p.salePrice ?? p.basePrice) }));
  };

  const noBarcodeCount = products.filter((p) => !getBarcode(p)).length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-bold">Barcode chop etish</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b bg-gray-50 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('nobarcode')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === 'nobarcode' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Barcodesiz {noBarcodeCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{noBarcodeCount}</span>}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Barchasi ({products.length})
            </button>
          </div>
          {noBarcodeCount > 0 && (
            <button
              onClick={generateAll}
              disabled={genAllLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${genAllLoading ? 'animate-spin' : ''}`} />
              Barchaga barcode yaratish
            </button>
          )}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Barcode className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {filter === 'nobarcode' ? "Barcodesiz mahsulot yo'q — hammasi tayyor!" : "Mahsulotlar yo'q"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 w-8">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-violet-600">
                      {filtered.every((p) => selected.has(p.id))
                        ? <CheckSquare className="h-4 w-4 text-violet-600" />
                        : <Square className="h-4 w-4" />
                      }
                    </button>
                  </th>
                  <th className="text-left px-2 py-2.5 font-semibold text-gray-600">Mahsulot</th>
                  <th className="text-left px-2 py-2.5 font-semibold text-gray-600">Barcode</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-gray-600 w-20">Soni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const bc = getBarcode(p);
                  const hasBarcode = isValidEAN13(bc);
                  const isGen = generating.has(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 ${selected.has(p.id) ? 'bg-violet-50/30' : ''}`}>
                      <td className="px-4 py-2.5">
                        <button onClick={() => toggleSelect(p.id)} disabled={!hasBarcode}>
                          {selected.has(p.id) && hasBarcode
                            ? <CheckSquare className="h-4 w-4 text-violet-600" />
                            : <Square className={`h-4 w-4 ${hasBarcode ? 'text-gray-400' : 'text-gray-200'}`} />
                          }
                        </button>
                      </td>
                      <td className="px-2 py-2.5">
                        <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </td>
                      <td className="px-2 py-2.5">
                        {hasBarcode ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{bc}</span>
                            <button
                              onClick={() => handlePreview(p)}
                              className="text-xs text-violet-600 hover:underline"
                            >
                              Ko'rish
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateOne(p)}
                            disabled={isGen}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
                          >
                            {isGen ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Yaratish
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={qty[p.id] ?? 1}
                          onChange={(e) => setQty((q) => ({ ...q, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                          disabled={!hasBarcode || !selected.has(p.id)}
                          className="w-14 text-center border border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {readyToPrint.length > 0 ? (
              <span><span className="font-semibold text-gray-900">{readyToPrint.length}</span> mahsulot, jami <span className="font-semibold text-gray-900">{readyToPrint.reduce((s, p) => s + (qty[p.id] ?? 1), 0)}</span> ta label</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> Birorta ham tanlangan barcode yo'q</span>
            )}
          </div>
          <button
            onClick={handlePrint}
            disabled={readyToPrint.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <Printer className="h-4 w-4" /> Chop etish
          </button>
        </div>
      </div>

      {/* SVG Preview popup */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-60"
          onClick={() => setPreview(null)}
        >
          <div className="bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: preview }} />
            <button onClick={() => setPreview(null)} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-800">
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
