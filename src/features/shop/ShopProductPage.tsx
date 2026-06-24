import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Shield, Truck, RefreshCw, CheckCircle, Tag, Heart } from 'lucide-react';
import { shopApi } from '@/api/shop.api';
import { useCartStore } from '@/stores/cart.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { formatCurrency } from '@/lib/formatters';

export default function ShopProductPage() {
  const { tenantSlug, slug } = useParams({ strict: false }) as { tenantSlug: string; slug: string };
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const { toggle, has } = useWishlistStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['shop', tenantSlug, 'product', slug],
    queryFn: () => shopApi.getProduct(tenantSlug, slug),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded-full" />
          <div className="h-8 bg-gray-100 rounded-full w-1/2" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-600 font-semibold text-lg">Mahsulot topilmadi</p>
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }}>
          <button className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
            Do'konga qaytish
          </button>
        </Link>
      </div>
    );
  }

  const inCart = items.find((i) => i.productId === product.id);
  const price = product.salePrice ?? product.basePrice;
  const wishlisted = has(product.id);
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
  const images = (product.imageUrls?.length ?? 0) > 0 ? product.imageUrls : [null];

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id, productName: product.name, slug: product.slug, sku: product.sku,
        unitPrice: price, imageUrl: product.imageUrls?.[0] ?? null,
      });
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="hover:text-violet-600 transition-colors flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Do'kon
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400">{product.category?.name}</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative group">
            {images[activeImg] ? (
              <img src={images[activeImg]!} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><span className="text-8xl opacity-10">📦</span></div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4">
                <span className="bg-rose-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">-{discount}%</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-violet-500 shadow-md' : 'border-gray-100 hover:border-violet-300'}`}>
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xl">📦</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" />
                {product.category?.name}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  <Star className="h-3 w-3 fill-amber-500" />
                  Top mahsulot
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
            <p className="text-xs text-gray-400 font-mono mt-2 bg-gray-50 inline-block px-2 py-1 rounded-lg">SKU: {product.sku}</p>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100">
            {product.salePrice ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-violet-700">{formatCurrency(product.salePrice)}</span>
                <span className="text-lg text-gray-400 line-through font-medium">{formatCurrency(product.basePrice)}</span>
                <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {formatCurrency(product.basePrice - product.salePrice)} tejash
                </span>
              </div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900">{formatCurrency(product.basePrice)}</span>
            )}
          </div>

          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold ${product.inStock ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <CheckCircle className={`h-4 w-4 ${product.inStock ? 'text-green-500' : 'text-red-400'}`} />
            {product.inStock ? `Mavjud — ${product.stockQty} ta qoldi` : 'Tugagan'}
          </div>

          {product.description && <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>}

          {product.inStock && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Miqdor:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Minus className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stockQty, q + 1))} className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Plus className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </div>
                <span className="text-xs text-gray-500 ml-1">Jami: <strong>{formatCurrency(price * qty)}</strong></span>
              </div>

              <button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg text-base">
                <ShoppingCart className="h-5 w-5" />
                Savatga qo'shish
                {inCart && <span className="ml-1 bg-white/20 text-xs font-medium px-2 py-0.5 rounded-full">{inCart.qty} ta</span>}
              </button>

              <button onClick={() => toggle({ productId: product.id, productName: product.name, slug: product.slug, price, imageUrl: product.imageUrls?.[0] ?? null })}
                className={`w-full flex items-center justify-center gap-2 border-2 font-bold py-3 rounded-xl transition-colors text-sm ${wishlisted ? 'border-rose-400 text-rose-500 hover:bg-rose-50' : 'border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500'}`}>
                <Heart className={`h-4 w-4 ${wishlisted ? 'fill-rose-500' : ''}`} />
                {wishlisted ? "Sevimlilarda bor" : "Sevimlilarga qo'shish"}
              </button>

              {inCart && (
                <Link to="/shop/$tenantSlug/cart" params={{ tenantSlug }} className="block">
                  <button className="w-full flex items-center justify-center gap-2 border-2 border-violet-600 text-violet-600 font-bold py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm">
                    Savatga o'tish →
                  </button>
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              { icon: Truck, label: 'Tez yetkazish', sub: '1-3 kun' },
              { icon: Shield, label: 'Kafolat', sub: '12 oy' },
              { icon: RefreshCw, label: 'Qaytarish', sub: '7 kun' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto">
                  <Icon className="h-5 w-5 text-violet-600" />
                </div>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
