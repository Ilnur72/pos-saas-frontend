import { useState, useEffect } from 'react';
import { Warehouse, DollarSign, TrendingUp, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { warehouseApi } from '@/api/tenant.api';

interface ValueItem {
  productId: string;
  productName: string;
  sku: string;
  category: string | null;
  qty: number;
  costPrice: number;
  salePrice: number;
  costValue: number;
  saleValue: number;
  potentialProfit: number;
  isLowStock: boolean;
}

interface ValueData {
  summary: {
    totalCostValue: number;
    totalSaleValue: number;
    potentialProfit: number;
    totalQty: number;
    productsCount: number;
    lowStockCount: number;
  };
  byCategory: { name: string; costValue: number; saleValue: number; qty: number; productsCount: number }[];
  items: ValueItem[];
}

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm"; }

export default function InventoryValuePage() {
  const [data, setData] = useState<ValueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'costValue' | 'qty' | 'potentialProfit'>('costValue');

  useEffect(() => {
    warehouseApi.getValue()
      .then((d: any) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = (data?.items ?? [])
    .filter((i) =>
      !filter ||
      i.productName.toLowerCase().includes(filter.toLowerCase()) ||
      i.sku.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ombor qiymati</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tannarx asosida ombor jami qiymati</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Yuklanmoqda...</div>
      ) : !data ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Ma'lumot yo'q</div>
      ) : (
        <>
          {/* Asosiy ko'rsatkichlar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
              <Warehouse className="h-6 w-6 mb-3 opacity-80" />
              <p className="text-xs font-bold uppercase opacity-80 tracking-wider mb-1">Ombor tannarx qiymati</p>
              <p className="text-3xl font-black">{fmt(data.summary.totalCostValue)}</p>
              <p className="text-sm opacity-80 mt-1.5">{data.summary.totalQty} ta · {data.summary.productsCount} mahsulot</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
              <DollarSign className="h-6 w-6 text-emerald-600 mb-3" />
              <p className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-1">Sotuv qiymati</p>
              <p className="text-3xl font-black text-emerald-700">{fmt(data.summary.totalSaleValue)}</p>
              <p className="text-sm text-gray-500 mt-1.5">Hamma omborni sotsa</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-green-100 p-6 shadow-sm">
              <TrendingUp className="h-6 w-6 text-green-600 mb-3" />
              <p className="text-xs font-bold uppercase text-green-700 tracking-wider mb-1">Potensial foyda</p>
              <p className="text-3xl font-black text-green-700">{fmt(data.summary.potentialProfit)}</p>
              <p className="text-sm text-gray-500 mt-1.5">Margin: {Math.round((data.summary.potentialProfit / data.summary.totalCostValue) * 100)}%</p>
            </div>
          </div>

          {/* Kategoriya bo'yicha */}
          {data.byCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Kategoriya bo'yicha qiymat
              </h3>
              <div className="space-y-2.5">
                {data.byCategory.map((cat) => {
                  const pct = (cat.costValue / data.summary.totalCostValue) * 100;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">{cat.name}</span>
                        <span className="text-gray-500">
                          <span className="font-bold text-gray-900">{fmt(cat.costValue)}</span>
                          <span className="text-xs ml-2">({cat.productsCount} mahsulot · {cat.qty} ta)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filterlar va sort */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Mahsulot qidirish..."
              className="flex-1 max-w-md border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setSortBy('costValue')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${sortBy === 'costValue' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Qiymat</button>
              <button onClick={() => setSortBy('potentialProfit')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${sortBy === 'potentialProfit' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Foyda</button>
              <button onClick={() => setSortBy('qty')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${sortBy === 'qty' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Miqdor</button>
            </div>
          </div>

          {/* Mahsulotlar jadvali */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mahsulot</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Qoldiq</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Tannarx</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Sotuv</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Qiymat</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Foyda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.slice(0, 100).map((item) => (
                  <tr key={item.productId} className={`hover:bg-gray-50/50 ${item.isLowStock ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {item.isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku} · {item.category ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{item.qty} ta</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{fmt(item.costPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{fmt(item.salePrice)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-violet-700">{fmt(item.costValue)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-emerald-700 font-semibold">{fmt(item.potentialProfit)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length > 100 && (
              <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 text-center">
                Ko'rsatildi: 100 / {filteredItems.length}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
