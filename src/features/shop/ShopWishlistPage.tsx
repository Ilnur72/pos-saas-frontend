import { Link, useParams } from '@tanstack/react-router';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/formatters';

export default function ShopWishlistPage() {
  const { tenantSlug } = useParams({ strict: false }) as { tenantSlug: string };
  const { items, remove, clear } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-5">
        <div className="w-24 h-24 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto">
          <Heart className="h-12 w-12 text-rose-200" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">Sevimlilar bo'sh</p>
          <p className="text-gray-500 text-sm mt-1">Yoqqan mahsulotlarni shu yerga saqlang</p>
        </div>
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }}>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md">
            <ArrowLeft className="h-4 w-4" />
            Do'konga qaytish
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          Sevimlilar ({items.length})
        </h1>
        <button onClick={clear} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
          Barchasini o'chirish
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
            <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: item.slug }} className="block relative aspect-[4/3] bg-gray-50 overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
              )}
              <button onClick={(e) => { e.preventDefault(); remove(item.productId); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Link>
            <div className="p-4 space-y-3">
              <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: item.slug }}>
                <p className="text-sm font-semibold text-gray-900 hover:text-violet-600 transition-colors line-clamp-2">{item.productName}</p>
              </Link>
              <p className="text-base font-extrabold text-gray-900">{formatCurrency(item.price)}</p>
              <button onClick={() => addItem({
                productId: item.productId, productName: item.productName, slug: item.slug, sku: '',
                unitPrice: item.price, imageUrl: item.imageUrl,
              })}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all">
                <ShoppingCart className="h-4 w-4" />
                Savatga qo'shish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
