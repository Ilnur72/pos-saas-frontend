import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Printer, Monitor, CreditCard, QrCode, Banknote, Tag, ChevronDown, Usb, Wifi, TrendingDown, Receipt } from 'lucide-react';
import { kassaApi, categoriesApi, expensesApi } from '@/api/tenant.api';
import { useAuthStore } from '@/stores/auth.store';
import { usePrinter } from './usePrinter';
import { buildReceipt } from './escpos';

interface Product { id: string; name: string; sku: string; basePrice: number; salePrice: number | null; wholesalePrice?: number | null; wholesaleMinQty?: number; currentStock: number; unit: string; category?: { id: string; name: string } }
interface CartItem { product: Product; qty: number; unitPrice: number }
interface Session { id: string; status: string; openedAt: string; openingCash: number; totalSales: number; totalCash: number; totalCard: number; totalQr: number; ordersCount: number }

const PAY_METHODS = [
  { key: 'CASH', label: 'Naqd', icon: Banknote, color: 'bg-green-500 hover:bg-green-600' },
  { key: 'CARD', label: 'Karta', icon: CreditCard, color: 'bg-blue-500 hover:bg-blue-600' },
  { key: 'PAYME', label: 'Payme', icon: QrCode, color: 'bg-purple-500 hover:bg-purple-600' },
  { key: 'CLICK', label: 'Click', icon: QrCode, color: 'bg-orange-500 hover:bg-orange-600' },
];

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)); }

function printReceipt(order: any, change: number, tenantName: string) {
  const lines = order.items.map((i: any) =>
    `${(i.product?.name ?? 'Mahsulot').padEnd(22).slice(0, 22)} ${String(i.qty).padStart(4)} x ${fmt(i.unitPrice).padStart(10)} = ${fmt(i.totalPrice).padStart(12)}`
  ).join('\n');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; }
  .center { text-align: center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
</style></head><body>
<div class="center bold big">${tenantName}</div>
<div class="center">KASSA CHEKI</div>
<div class="line"></div>
<pre>${lines}</pre>
<div class="line"></div>
<div style="display:flex;justify-content:space-between"><span>JAMI:</span><span class="bold">${fmt(order.totalAmount)} so'm</span></div>
${order.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Chegirma:</span><span>-${fmt(order.discountAmount)} so'm</span></div>` : ''}
${change > 0 ? `<div style="display:flex;justify-content:space-between"><span>Qaytim:</span><span>${fmt(change)} so'm</span></div>` : ''}
<div class="line"></div>
<div class="center">Chek: ${order.orderNumber}</div>
<div class="center">${new Date(order.createdAt ?? Date.now()).toLocaleString('uz-UZ')}</div>
<div class="center" style="margin-top:8px">Xarid uchun rahmat!</div>
</body></html>`;

  const w = window.open('', '_blank', 'width=340,height=500');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 300);
}

export default function KassaPage() {
  const { tenant } = useAuthStore();
  const printer = usePrinter();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeCat, setActiveCat] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState('CASH');
  const [tendered, setTendered] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receipt, setReceipt] = useState<{ order: any; change: number } | null>(null);

  // Quick chiqim modali
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState<{ category: string; amount: string; note: string }>({ category: 'OTHER', amount: '', note: '' });
  const [expenseSaving, setExpenseSaving] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);

  // Session yuklash
  useEffect(() => {
    kassaApi.getSession().then((s: any) => { setSession(s); setSessionLoading(false); }).catch(() => setSessionLoading(false));
    categoriesApi.getAll().then((r: any) => setCategories(Array.isArray(r) ? r : r.data ?? [])).catch(() => {});
  }, []);

  // Klaviatura shortcutlar — F2 qidiruv, F4 chegirma, F12 yakunlash, Esc savatni tozalash
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Modal ochiq bo'lganda ishlatmaymiz
      if (openModal || closeModal || receipt) return;
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        discountRef.current?.focus();
        discountRef.current?.select();
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0 && session && !checkoutLoading) {
          handleCheckoutRef.current?.();
        }
      } else if (e.key === 'Escape') {
        if (cart.length > 0) {
          if (confirm('Savatni tozalaysizmi?')) clearCart();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length, session, checkoutLoading, openModal, closeModal, receipt]);

  // handleCheckout uchun ref (yangilangan funksiyaga doim kirish)
  const handleCheckoutRef = useRef<() => void>();

  // Mahsulotlarni qidirish
  const loadProducts = useCallback(async (q: string, catId: string) => {
    setLoadingProducts(true);
    try {
      const params: any = {};
      if (q) params.q = q;
      if (catId) params.categoryId = catId;
      const data = await kassaApi.getProducts(params);
      setProducts(Array.isArray(data) ? data : data.data ?? []);
    } catch { setProducts([]); } finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadProducts(search, activeCat), 300);
    return () => clearTimeout(t);
  }, [search, activeCat, loadProducts]);

  // Barcode scanner: Enter bosilganda barcode → SKU tartibida qidirish
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = search.trim();
    if (!q) return;
    // Avval local state dan qidirish
    const local = products.find(
      (p) => (p as any).barcode === q || p.sku.toLowerCase() === q.toLowerCase(),
    );
    if (local) { addToCart(local); setSearch(''); return; }
    // Topilmasa backenddan barcode bilan qidirish
    try {
      const data = await kassaApi.getProducts({ q });
      const found = (Array.isArray(data) ? data : data.data ?? []).find(
        (p: any) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase(),
      );
      if (found) { addToCart(found); setSearch(''); }
      else { setSearch(q); } // qidiruv maydonida qoldir
    } catch { /* ignore */ }
  };

  // Optom narxni hisoblash
  const getPriceForQty = (product: Product, qty: number): number => {
    const minQty = product.wholesaleMinQty ?? 0;
    if (product.wholesalePrice && minQty > 0 && qty >= minQty) {
      return product.wholesalePrice;
    }
    return product.salePrice ?? product.basePrice;
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const newCart = [...prev];
        if (newCart[idx].qty < product.currentStock) {
          const newQty = newCart[idx].qty + 1;
          newCart[idx] = { ...newCart[idx], qty: newQty, unitPrice: getPriceForQty(product, newQty) };
        }
        return newCart;
      }
      return [...prev, { product, qty: 1, unitPrice: getPriceForQty(product, 1) }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.product.id !== productId) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return null as any;
      if (newQty > i.product.currentStock) return i;
      return { ...i, qty: newQty, unitPrice: getPriceForQty(i.product, newQty) };
    }).filter(Boolean));
  };

  const removeFromCart = (productId: string) => setCart((p) => p.filter((i) => i.product.id !== productId));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const discountVal = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);
  const tenderedVal = Number(tendered) || 0;
  const change = payMethod === 'CASH' && tenderedVal > totalAmount ? tenderedVal - totalAmount : 0;

  // Smena ochish
  const handleOpenSession = async () => {
    try {
      const s = await kassaApi.openSession({ openingCash: Number(openingCash) || 0 });
      setSession(s); setOpenModal(false); setOpeningCash('');
    } catch (e: any) { alert(e.response?.data?.message ?? 'Xatolik'); }
  };

  // Smena davomida chiqim qo'shish
  const handleSaveExpense = async () => {
    if (!session) return;
    const amount = Number(expenseData.amount);
    if (!amount || amount <= 0) return;
    setExpenseSaving(true);
    try {
      await expensesApi.create({
        category: expenseData.category,
        amount,
        note: expenseData.note || undefined,
        sessionId: session.id,
        paidVia: 'CASH',
      });
      // Sessionni yangilash
      const s = await kassaApi.getSession();
      setSession(s);
      setExpenseModal(false);
      setExpenseData({ category: 'OTHER', amount: '', note: '' });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Xatolik');
    } finally {
      setExpenseSaving(false);
    }
  };

  // Smena yopish
  const handleCloseSession = async () => {
    if (!session) return;
    try {
      await kassaApi.closeSession(session.id, { closingCash: Number(closingCash) || 0, notes: sessionNotes });
      setSession(null); setCloseModal(false); setClosingCash(''); setSessionNotes('');
    } catch (e: any) { alert(e.response?.data?.message ?? 'Xatolik'); }
  };

  // To'lov
  handleCheckoutRef.current = () => handleCheckout();
  const handleCheckout = async () => {
    if (!cart.length) return;
    if (!session) { alert('Avval smena oching'); return; }
    setCheckoutLoading(true);
    try {
      const result = await kassaApi.checkout({
        items: cart.map((i) => ({ productId: i.product.id, qty: i.qty, unitPrice: i.unitPrice })),
        paymentMethod: payMethod,
        sessionId: session.id,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tendered: tenderedVal > 0 ? tenderedVal : undefined,
        discount: discountVal > 0 ? discountVal : undefined,
      });
      setReceipt({ order: result.order, change: result.change });
      setSession((prev) => prev ? {
        ...prev,
        totalSales: (prev.totalSales ?? 0) + result.totalAmount,
        ordersCount: (prev.ordersCount ?? 0) + 1,
      } : prev);
      clearCart();
      setTendered(''); setDiscount(''); setCustomerName(''); setCustomerPhone('');
      loadProducts(search, activeCat);
    } catch (e: any) { alert(e.response?.data?.message ?? 'To\'lov amalga oshmadi'); } finally { setCheckoutLoading(false); }
  };

  if (sessionLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-56px)] -m-7 overflow-hidden bg-gray-100">

      {/* ═══ Left: Products ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Monitor className="h-5 w-5 text-violet-600 flex-shrink-0" />
          <span className="font-bold text-gray-900">Kassa</span>
          {session ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              Smena #{session.id.slice(-4)} | {fmt(session.totalSales)} so'm
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Smena yopiq</span>
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Mahsulot nomi yoki barcode..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
          </div>
          {/* Printer tugmasi */}
          {printer.isSupported && (
            <button
              onClick={printer.connected ? printer.disconnect : printer.connect}
              title={printer.connected ? `Ulangan: ${printer.deviceName}` : (printer.error || 'Printerni ulash')}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-semibold border transition-colors ${printer.connected ? 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              <Usb className="h-4 w-4" />
              {printer.connected ? <Wifi className="h-3 w-3 text-green-500" /> : <Printer className="h-3 w-3" />}
            </button>
          )}
          {session ? (
            <>
              <button onClick={() => setExpenseModal(true)} className="flex items-center gap-1.5 text-sm text-amber-700 hover:bg-amber-50 px-3 py-2 rounded-xl font-semibold border border-amber-200 transition-colors">
                <TrendingDown className="h-4 w-4" /> Chiqim
              </button>
              <button onClick={() => setCloseModal(true)} className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl font-semibold border border-red-200 transition-colors">
                <X className="h-4 w-4" /> Smena yopish
              </button>
            </>
          ) : (
            <button onClick={() => setOpenModal(true)} className="flex items-center gap-1.5 text-sm text-white bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-xl font-semibold transition-colors">
              Smena ochish
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold transition-colors ${!activeCat ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Barcha
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(activeCat === c.id ? '' : c.id)}
              className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold transition-colors ${activeCat === c.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loadingProducts ? (
            <div className="text-center text-gray-400 py-12">Yuklanmoqda...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-400 py-12">Mahsulot topilmadi</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {products.map((p) => {
                const price = p.salePrice ?? p.basePrice;
                const inCart = cart.find((i) => i.product.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.currentStock <= 0}
                    className={`text-left p-3 rounded-xl border transition-all ${p.currentStock <= 0 ? 'opacity-40 cursor-not-allowed bg-white border-gray-200' : inCart ? 'bg-violet-50 border-violet-300 shadow-sm' : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                      {inCart && <span className="flex-shrink-0 bg-violet-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{inCart.qty}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1">{p.sku}</p>
                    <p className="text-sm font-bold text-violet-700">{fmt(price)}</p>
                    {p.wholesalePrice && p.wholesaleMinQty && p.wholesaleMinQty > 0 && (
                      <p className="text-[10px] text-blue-600 font-medium">
                        Optom: {fmt(p.wholesalePrice)} ({p.wholesaleMinQty}+)
                      </p>
                    )}
                    <p className={`text-[10px] mt-0.5 ${p.currentStock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                      Stok: {p.currentStock}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Right: Cart ══════════════════════════════════════════════════ */}
      <div className="w-[360px] bg-white border-l flex flex-col">
        {/* Cart header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <span className="font-bold text-gray-900">Savat</span>
            {cart.length > 0 && <span className="bg-violet-100 text-violet-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">Tozalash</button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Savat bo'sh</p>
              <p className="text-xs mt-0.5">Mahsulotni bosing</p>
            </div>
          ) : cart.map((item) => {
            const isWholesale = !!(item.product.wholesalePrice && item.product.wholesaleMinQty && item.qty >= item.product.wholesaleMinQty);
            return (
            <div key={item.product.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-violet-600 font-medium">{fmt(item.unitPrice)} so'm</p>
                  {isWholesale && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">OPTOM</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                  <Minus className="h-3 w-3 text-gray-600" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors">
                  <Plus className="h-3 w-3 text-gray-600" />
                </button>
              </div>
              <p className="text-xs font-bold text-gray-900 w-16 text-right">{fmt(item.qty * item.unitPrice)}</p>
              <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            );
          })}
        </div>

        {/* Payment section */}
        <div className="border-t px-3 py-3 space-y-3">
          {/* Customer (ixtiyoriy) */}
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180 transition-transform" />
              Mijoz (ixtiyoriy)
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ism" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+998..." className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
            </div>
          </details>

          {/* Chegirma */}
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={discountRef}
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Chegirma (so'm)"
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          {/* Jami */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Jami:</span><span className="font-semibold text-gray-900">{fmt(subtotal)} so'm</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Chegirma:</span><span>-{fmt(discountVal)} so'm</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1 mt-1">
              <span>TO'LOV:</span><span className="text-violet-700 text-base">{fmt(totalAmount)} so'm</span>
            </div>
          </div>

          {/* To'lov usuli */}
          <div className="grid grid-cols-4 gap-1.5">
            {PAY_METHODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setPayMethod(m.key)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${payMethod === m.key ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Naqd uchun berilgan pul */}
          {payMethod === 'CASH' && (
            <div>
              <input
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder={`Berilgan pul (min: ${fmt(totalAmount)})`}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {change > 0 && (
                <p className="text-sm font-bold text-green-600 mt-1 text-right">Qaytim: {fmt(change)} so'm</p>
              )}
            </div>
          )}

          {/* Checkout tugmasi */}
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || cart.length === 0 || !session}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
          >
            {checkoutLoading ? 'Amalga oshirilmoqda...' : session ? `To'lov: ${fmt(totalAmount)} so'm` : 'Smena oching'}
            <span className="ml-2 text-[10px] opacity-70 bg-white/10 px-1.5 py-0.5 rounded">F12</span>
          </button>

          {/* Shortcutlar yo'riqnomasi */}
          <div className="flex items-center justify-around text-[10px] text-gray-400 pt-1 border-t border-gray-100">
            <span><kbd className="bg-gray-100 px-1 rounded">F2</kbd> Qidiruv</span>
            <span><kbd className="bg-gray-100 px-1 rounded">F4</kbd> Chegirma</span>
            <span><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Tozalash</span>
          </div>
        </div>
      </div>

      {/* ═══ Modal: Smena ochish ══════════════════════════════════════════ */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Smena ochish</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kassadagi naqd pul (boshlang'ich)</label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpenModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
              <button onClick={handleOpenSession} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold">Ochish</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Smena yopish ══════════════════════════════════════════ */}
      {closeModal && session && (() => {
        const openingCash = Number(session.openingCash ?? 0);
        const totalCash = Number(session.totalCash ?? 0);
        const totalExpenses = Number(session.totalExpenses ?? 0);
        const expectedCash = openingCash + totalCash - totalExpenses;
        const closing = Number(closingCash) || 0;
        const difference = closing - expectedCash;
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900">Smena yopish</h2>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Buyurtmalar:</span><span className="font-semibold">{session.ordersCount} ta</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Jami sotuv:</span><span className="font-semibold">{fmt(session.totalSales)} so'm</span></div>
                <div className="border-t border-gray-200 pt-1.5 mt-1.5"></div>
                <div className="flex justify-between"><span className="text-gray-500">💵 Naqd:</span><span>{fmt(totalCash)} so'm</span></div>
                <div className="flex justify-between"><span className="text-gray-500">💳 Karta:</span><span>{fmt(session.totalCard)} so'm</span></div>
                <div className="flex justify-between"><span className="text-gray-500">📱 QR (Payme/Click):</span><span>{fmt(session.totalQr)} so'm</span></div>
              </div>

              {/* Kutilayotgan kassa hisobi */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-1.5 text-sm border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-1.5">📊 Kassada bo'lishi kerak (naqd):</p>
                <div className="flex justify-between"><span className="text-gray-600">Boshlang'ich naqd:</span><span>+ {fmt(openingCash)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Naqd sotuv:</span><span>+ {fmt(totalCash)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Naqd chiqim:</span><span>− {fmt(totalExpenses)}</span></div>
                <div className="border-t border-blue-200 pt-1.5 mt-1.5 flex justify-between font-bold text-blue-700">
                  <span>Kutilgan kassa:</span><span>{fmt(expectedCash)} so'm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Haqiqiy kassadagi pul (sanab kiriting)</label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Farq — kamomad yoki ortiqcha */}
              {closingCash !== '' && (
                <div className={`rounded-xl p-3 border-2 ${
                  difference === 0 ? 'bg-emerald-50 border-emerald-200' :
                  difference > 0 ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${
                      difference === 0 ? 'text-emerald-700' :
                      difference > 0 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {difference === 0 ? '✓ Mos' : difference > 0 ? '⊕ Ortiqcha' : '⚠️ KAMOMAD'}
                    </span>
                    <span className={`text-xl font-black ${
                      difference === 0 ? 'text-emerald-700' :
                      difference > 0 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {difference > 0 ? '+' : ''}{fmt(difference)} so'm
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh (ixtiyoriy)</label>
                <input value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder={difference < 0 ? 'Kamomad sababi...' : ''} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCloseModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
                <button onClick={handleCloseSession} disabled={closingCash === ''} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                  Smena yopish
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ Modal: Chiqim (smena davomida) ══════════════════════════════════ */}
      {expenseModal && session && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Naqd chiqim</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">Kassadan chiqarilgan naqd pulni qayd eting</p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategoriya</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'SALARY', l: 'Oylik' },
                  { v: 'UTILITY', l: 'Kommunal' },
                  { v: 'PURCHASE', l: 'Xarid' },
                  { v: 'TRANSPORT', l: 'Transport' },
                  { v: 'RENT', l: 'Ijara' },
                  { v: 'OTHER', l: 'Boshqa' },
                ].map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => setExpenseData({ ...expenseData, category: c.v })}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${expenseData.category === c.v ? 'bg-amber-50 text-amber-700 border-amber-400' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {c.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Summa (so'm) *</label>
              <input
                type="number"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                placeholder="0"
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Izoh</label>
              <input
                value={expenseData.note}
                onChange={(e) => setExpenseData({ ...expenseData, note: e.target.value })}
                placeholder="Masalan: kuryer haqi"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setExpenseModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Bekor</button>
              <button onClick={handleSaveExpense} disabled={expenseSaving || !Number(expenseData.amount)} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                {expenseSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Chek ══════════════════════════════════════════════════ */}
      {receipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">To'lov amalga oshdi!</h2>
              <p className="text-sm text-gray-500 mt-1">{receipt.order.orderNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
              {receipt.order.items?.map((i: any) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-gray-600 truncate mr-2">{i.product?.name} × {i.qty}</span>
                  <span className="font-semibold flex-shrink-0">{fmt(i.totalPrice)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold">
                <span>JAMI:</span><span className="text-violet-700">{fmt(receipt.order.totalAmount)} so'm</span>
              </div>
              {receipt.change > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Qaytim:</span><span>{fmt(receipt.change)} so'm</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReceipt(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Yopish</button>
              <button
                onClick={async () => {
                  const name = tenant?.name ?? 'Santexnika';
                  if (printer.connected) {
                    try {
                      const data = buildReceipt(receipt.order, receipt.change, name);
                      await printer.print(data);
                    } catch { printReceipt(receipt.order, receipt.change, name); }
                  } else {
                    printReceipt(receipt.order, receipt.change, name);
                  }
                  setReceipt(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                <Printer className="h-4 w-4" />
                {printer.connected ? 'ESC/POS chiqarish' : 'Chek chiqarish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
