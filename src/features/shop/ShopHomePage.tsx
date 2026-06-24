import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { Search, ShoppingCart, Tag, ArrowRight, Star, TrendingUp, Heart } from 'lucide-react';
import { shopApi, type ShopProduct } from '@/api/shop.api';
import { useCartStore } from '@/stores/cart.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/formatters';

function ProductCard({ product, tenantSlug }: { product: ShopProduct; tenantSlug: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const inCart = items.find((i) => i.productId === product.id);
  const { toggle, has } = useWishlistStore();
  const wishlisted = has(product.id);
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: product.slug }} className="relative block overflow-hidden bg-gray-50 aspect-[4/3]">
        {product.imageUrls[0] ? (
          <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><div className="text-5xl opacity-20">📦</div></div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">-{discount}%</span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5" /> Top
            </span>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Tugagan</span>
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggle({ productId: product.id, productName: product.name, slug: product.slug, price: product.salePrice ?? product.basePrice, imageUrl: product.imageUrls[0] ?? null }); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
        </button>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-violet-600 font-semibold uppercase tracking-wide mb-1">{product.category.name}</p>
        <Link to="/shop/$tenantSlug/$slug" params={{ tenantSlug, slug: product.slug }}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-violet-600 transition-colors leading-snug flex-1">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {product.salePrice ? (
              <>
                <p className="text-base font-extrabold text-gray-900">{formatCurrency(product.salePrice)}</p>
                <p className="text-xs text-gray-400 line-through">{formatCurrency(product.basePrice)}</p>
              </>
            ) : (
              <p className="text-base font-extrabold text-gray-900">{formatCurrency(product.basePrice)}</p>
            )}
          </div>
          <button
            disabled={!product.inStock}
            onClick={() => addItem({
              productId: product.id, productName: product.name, slug: product.slug, sku: product.sku,
              unitPrice: product.salePrice ?? product.basePrice, imageUrl: product.imageUrls[0] ?? null,
            })}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              inCart ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              : product.inStock ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-md hover:from-violet-700 hover:to-indigo-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inCart ? `${inCart.qty} ta` : 'Qo\'sh'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3.5 bg-gray-100 rounded-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
      </div>
    </div>
  );
}

export default function ShopHomePage() {
  const { tenantSlug } = useParams({ strict: false }) as { tenantSlug: string };
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data: categories } = useQuery({
    queryKey: ['shop', tenantSlug, 'categories'],
    queryFn: () => shopApi.getCategories(tenantSlug),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['shop', tenantSlug, 'featured'],
    queryFn: () => shopApi.getProducts(tenantSlug, { featured: true, limit: 4 }),
    enabled: !debouncedSearch && !categoryId && page === 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shop', tenantSlug, 'products', debouncedSearch, categoryId, page],
    queryFn: () => shopApi.getProducts(tenantSlug, { search: debouncedSearch, categoryId, page, limit: 12 }),
  });

  const showFeatured = !debouncedSearch && !categoryId && page === 1 && featuredData && featuredData.data.length > 0;

  return (
    <div className="space-y-8">
      {!debouncedSearch && !categoryId && page === 1 && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 md:p-12">
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <TrendingUp className="h-3 w-3" />
              Eng ko'p sotilgan mahsulotlar
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              Sifatli mahsulotlar<br />qulay narxda
            </h1>
            <p className="text-violet-200 text-sm mb-6">Minglab mahsulotlar orasidan o'zingizga mosini toping</p>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Mahsulot qidiring..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          />
        </div>
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2.5 bg-white border border-gray-200 rounded-xl transition-colors">
            Tozalash
          </button>
        )}
      </div>

      {categories && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setCategoryId(undefined); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              !categoryId ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            Barchasi
          </button>
          {categories.filter((c) => !c.parentId).map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(cat.id); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                categoryId === cat.id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <Tag className="h-3 w-3" />
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {showFeatured && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              Featured mahsulotlar
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {featuredData.data.map((p) => <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            {debouncedSearch || categoryId ? `${data?.meta.total ?? 0} ta mahsulot` : 'Barcha mahsulotlar'}
          </h2>
          {data && <span className="text-sm text-gray-500">{data.meta.total} ta</span>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">Mahsulot topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.data.map((p) => <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} />)}
          </div>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white">
            ← Oldingi
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(data.meta.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm font-semibold ${page === p ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button disabled={page === data.meta.totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white">
            Keyingi →
          </button>
        </div>
      )}
    </div>
  );
}
