import { useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { ShoppingCart, Search, Menu, X, Zap, Heart } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/api/shop.api';

export default function ShopLayout() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ strict: false }) as { tenantSlug: string };
  const totalItems = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ['shop', tenantSlug, 'tenant'],
    queryFn: () => shopApi.getTenantInfo(tenantSlug),
    enabled: !!tenantSlug,
  });

  const { data: categories } = useQuery({
    queryKey: ['shop', tenantSlug, 'categories'],
    queryFn: () => shopApi.getCategories(tenantSlug),
    enabled: !!tenantSlug,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: '/shop/$tenantSlug', params: { tenantSlug }, search: { q: search.trim() } as never });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs py-2 text-center font-medium tracking-wide">
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3 w-3" />
          Bepul yetkazib berish — 500,000 so'mdan yuqori buyurtmalarda
          <Zap className="h-3 w-3" />
        </span>
      </div>

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md overflow-hidden">
                  {tenant?.logoUrl ? <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" /> : <Zap className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <p className="font-extrabold text-gray-900 text-base leading-tight">{tenant?.name ?? 'DO\'KON'}</p>
                  <p className="text-[9px] text-violet-600 font-semibold tracking-widest uppercase leading-tight">Online Do'kon</p>
                </div>
              </div>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mahsulot qidiring..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </form>

            <div className="flex items-center gap-3 ml-auto">
              <Link to="/shop/$tenantSlug/wishlist" params={{ tenantSlug }} className="relative hidden sm:flex">
                <button className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-rose-500 hover:border-rose-300 transition-all">
                  <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </Link>
              <Link to="/shop/$tenantSlug/cart" params={{ tenantSlug }}>
                <button className="relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:from-violet-700 hover:to-indigo-700 transition-all">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Savat</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
              </Link>

              <button className="md:hidden p-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mahsulot qidiring..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>

        {categories && categories.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
                <Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:text-violet-600 hover:bg-white transition-all whitespace-nowrap">
                  Barchasi
                </Link>
                {categories.filter((c) => !c.parentId).map((cat) => (
                  <Link
                    key={cat.id}
                    to="/shop/$tenantSlug"
                    params={{ tenantSlug }}
                    search={{ categoryId: cat.id } as never}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:text-violet-600 hover:bg-white transition-all whitespace-nowrap"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-extrabold text-white text-sm">{tenant?.name ?? 'DO\'KON'}</span>
              </div>
              <p className="text-xs leading-relaxed">Sifatli mahsulotlar, qulay narxlar va tez yetkazib berish.</p>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-3">Do'kon</p>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="hover:text-white transition-colors">Mahsulotlar</Link></li>
                <li><Link to="/shop/$tenantSlug/cart" params={{ tenantSlug }} className="hover:text-white transition-colors">Savat</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-3">To'lov</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Payme', 'Click', 'Uzum', 'Naqd'].map((p) => (
                  <span key={p} className="px-2 py-1 bg-gray-800 rounded text-[10px] font-medium text-gray-300">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-3">Aloqa</p>
              <ul className="space-y-1.5 text-xs">
                {tenant?.phone && <li>{tenant.phone}</li>}
                {tenant?.address && <li>{tenant.address}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            © 2026 {tenant?.name ?? 'DO\'KON'}. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  );
}
