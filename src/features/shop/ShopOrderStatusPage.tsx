import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { CheckCircle, Clock, Package, Truck, XCircle, Home, RotateCcw, Copy } from 'lucide-react';
import { shopApi } from '@/api/shop.api';
import { formatCurrency } from '@/lib/formatters';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; label: string; color: string; bg: string; step: number }> = {
  PENDING: { icon: <Clock className="h-7 w-7" />, label: 'Kutilmoqda', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', step: 1 },
  CONFIRMED: { icon: <CheckCircle className="h-7 w-7" />, label: 'Tasdiqlandi', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', step: 2 },
  PROCESSING: { icon: <Package className="h-7 w-7" />, label: 'Tayyorlanmoqda', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', step: 3 },
  SHIPPED: { icon: <Truck className="h-7 w-7" />, label: 'Yo\'lda', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', step: 4 },
  DELIVERED: { icon: <CheckCircle className="h-7 w-7" />, label: 'Yetkazildi', color: 'text-green-600', bg: 'bg-green-50 border-green-200', step: 5 },
  CANCELLED: { icon: <XCircle className="h-7 w-7" />, label: 'Bekor qilindi', color: 'text-red-600', bg: 'bg-red-50 border-red-200', step: 0 },
  REFUNDED: { icon: <RotateCcw className="h-7 w-7" />, label: 'Qaytarildi', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', step: 0 },
};

const PROGRESS_STEPS = [
  { status: 'PENDING', label: 'Buyurtma', icon: Clock },
  { status: 'CONFIRMED', label: 'Tasdiqlash', icon: CheckCircle },
  { status: 'PROCESSING', label: 'Tayyorlash', icon: Package },
  { status: 'SHIPPED', label: "Yo'lda", icon: Truck },
  { status: 'DELIVERED', label: 'Yetkazildi', icon: Home },
];

const PAYMENT_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  UNPAID: { label: "To'lanmagan", color: 'text-amber-600 bg-amber-50' },
  PAID: { label: "To'langan", color: 'text-green-600 bg-green-50' },
  REFUNDED: { label: 'Qaytarildi', color: 'text-gray-600 bg-gray-100' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum' };

export default function ShopOrderStatusPage() {
  const { tenantSlug, orderNumber } = useParams({ strict: false }) as { tenantSlug: string; orderNumber: string };

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['shop', tenantSlug, 'order', orderNumber],
    queryFn: () => shopApi.getOrderStatus(tenantSlug, orderNumber),
    refetchInterval: 30000,
  });

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber).then(() => alert('Nusxalandi!'));
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-16 space-y-5 animate-pulse">
        <div className="bg-white rounded-2xl h-48 border border-gray-100" />
        <div className="bg-white rounded-2xl h-32 border border-gray-100" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-700 font-bold text-lg">Buyurtma topilmadi</p>
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }}>
          <button className="mt-6 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">
            Do'konga qaytish
          </button>
        </Link>
      </div>
    );
  }

  const o = order as any;
  const statusCfg = STATUS_CONFIG[o.status as OrderStatus] ?? STATUS_CONFIG.PENDING;
  const currentStep = statusCfg.step;
  const isCancelled = o.status === 'CANCELLED' || o.status === 'REFUNDED';
  const paymentCfg = PAYMENT_LABELS[o.paymentStatus as PaymentStatus] ?? PAYMENT_LABELS.UNPAID;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className={`bg-white rounded-2xl border-2 ${statusCfg.bg} p-6 text-center shadow-sm`}>
        <div className={`w-16 h-16 rounded-2xl ${isCancelled ? 'bg-red-100' : 'bg-gradient-to-br from-violet-100 to-indigo-100'} flex items-center justify-center mx-auto mb-4`}>
          <div className={statusCfg.color}>{statusCfg.icon}</div>
        </div>

        <h1 className={`text-xl font-extrabold ${statusCfg.color} mb-1`}>
          {o.status === 'DELIVERED' ? 'Buyurtmangiz yetkazildi!' : statusCfg.label}
        </h1>

        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-sm text-gray-500">Buyurtma: <span className="font-mono font-bold text-gray-900">{o.orderNumber}</span></p>
          <button onClick={copyOrderNumber} className="text-gray-400 hover:text-violet-600 transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mt-3">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${paymentCfg.color}`}>{paymentCfg.label}</span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">{PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</span>
        </div>
      </div>

      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-gray-900 mb-5">Buyurtma holati</h2>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${Math.max(0, ((currentStep - 1) / (PROGRESS_STEPS.length - 1)) * 100)}%` }} />
            </div>

            <div className="relative flex justify-between">
              {PROGRESS_STEPS.map(({ status, label, icon: Icon }, i) => {
                const stepNum = i + 1;
                const done = stepNum < currentStep;
                const active = stepNum === currentStep;
                return (
                  <div key={status} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all z-10 ${
                      done ? 'bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-600 shadow-md'
                      : active ? 'bg-white border-violet-500 shadow-lg'
                      : 'bg-white border-gray-200'
                    }`}>
                      <Icon className={`h-4 w-4 ${done ? 'text-white' : active ? 'text-violet-600' : 'text-gray-300'}`} />
                    </div>
                    <p className={`text-[10px] font-semibold text-center max-w-[50px] leading-tight ${done || active ? 'text-gray-700' : 'text-gray-400'}`}>{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-gray-900">Buyurtma tarkibi</h2>
        <div className="space-y-3">
          {o.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                {item.productSnapshot?.imageUrl ? <img src={item.productSnapshot.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg opacity-20">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.productSnapshot?.name ?? 'Mahsulot'}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} × {item.qty} ta</p>
              </div>
              <p className="text-sm font-extrabold text-gray-900 shrink-0">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-extrabold text-gray-900">Jami</span>
          <span className="text-lg font-extrabold text-violet-700">{formatCurrency(o.totalAmount)}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center justify-between text-sm text-gray-500">
        <span>Buyurtma sanasi</span>
        <span className="font-semibold text-gray-700">
          {new Date(o.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <Link to="/shop/$tenantSlug" params={{ tenantSlug }} className="block">
        <button className="w-full flex items-center justify-center gap-2 border-2 border-violet-600 text-violet-600 font-bold py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm">
          Xarid qilishni davom etish
        </button>
      </Link>
    </div>
  );
}
