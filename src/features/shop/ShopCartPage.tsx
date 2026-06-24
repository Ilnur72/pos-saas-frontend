import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/formatters';

export default function ShopCartPage() {
  const { tenantSlug } = useParams({ strict: false }) as { tenantSlug: string };
  const { items, updateQty, removeItem, totalPrice, clearCart } = useCartStore();
  const total = totalPrice();
  const shippingThreshold = 500000;
  const shipping = total >= shippingThreshold ? 0 : 30000;
  const grandTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-5">
        <div className="w-24 h-24 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto">
          <ShoppingBag className="h-12 w-12 text-violet-300" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">Savat bo'sh</p>
          <p className="text-gray-500 text-sm mt-1">Mahsulot qo'shing va xarid qiling</p>
        </div>
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }}>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md">
            <ArrowLeft className="h-4 w-4" />
            Xarid qilishni boshlash
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-gray-900">Savat ({items.length})</h1>
            <button onClick={() => clearCart()} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
              Barchasini o'chirish
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: item.slug }} className="shrink-0">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: item.slug }}>
                    <p className="font-semibold text-gray-900 hover:text-violet-600 transition-colors text-sm leading-snug line-clamp-2">{item.productName}</p>
                  </Link>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
                  <p className="text-sm font-bold text-violet-700 mt-1">{formatCurrency(item.unitPrice)}</p>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
                    <button onClick={() => updateQty(item.productId, item.qty - 1)} className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                      <Minus className="h-3 w-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, item.qty + 1)} className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                      <Plus className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold text-gray-900">{formatCurrency(item.qty * item.unitPrice)}</p>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors mt-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            Xaridni davom etish
          </Link>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 sticky top-24">
            <h2 className="text-base font-extrabold text-gray-900">Buyurtma xulosasi</h2>

            <div className="border-t border-gray-100 pt-3 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Mahsulotlar ({items.length})</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-violet-500" />
                  Yetkazish
                </span>
                {shipping === 0 ? <span className="font-semibold text-green-600">Bepul</span> : <span className="font-semibold">{formatCurrency(shipping)}</span>}
              </div>
            </div>

            {shipping > 0 && (
              <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700 flex items-start gap-2">
                <Tag className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Yana <strong>{formatCurrency(shippingThreshold - total)}</strong> qo'shsangiz — yetkazish bepul!</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="text-base font-extrabold text-gray-900">Jami</span>
              <span className="text-xl font-extrabold text-violet-700">{formatCurrency(grandTotal)}</span>
            </div>

            <Link to="/shop/$tenantSlug/checkout" params={{ tenantSlug }}>
              <button className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg">
                Buyurtma berish
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>

            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-2">To'lov usullari</p>
              <div className="flex justify-center gap-2">
                {['Payme', 'Click', 'Uzum', 'Naqd'].map((p) => (
                  <span key={p} className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
