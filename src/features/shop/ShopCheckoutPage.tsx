import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Truck, Home, CheckCircle, ArrowRight } from 'lucide-react';
import { shopApi } from '@/api/shop.api';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/formatters';

const schema = z.object({
  customerName: z.string().min(2, 'Ism kerak (kamida 2 harf)'),
  customerPhone: z.string().min(9, 'Telefon raqam kerak'),
  customerEmail: z.string().email('Noto\'g\'ri email').optional().or(z.literal('')),
  deliveryMethod: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  paymentMethod: z.enum(['CASH', 'PAYME', 'CLICK', 'UZUM']).default('CASH'),
  address: z.string().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Naqd pul', sub: 'Yetkazishda to\'lash', emoji: '💵' },
  { value: 'PAYME', label: 'Payme', sub: 'Online to\'lov', emoji: '💳' },
  { value: 'CLICK', label: 'Click', sub: 'Online to\'lov', emoji: '📱' },
  { value: 'UZUM', label: 'Uzum', sub: 'Online to\'lov', emoji: '🟠' },
] as const;

const DELIVERY_OPTIONS = [
  { value: 'PICKUP', label: 'Olib ketish', sub: 'Do\'kondan olib keting', icon: Home },
  { value: 'DELIVERY', label: 'Yetkazib berish', sub: '1-3 ish kuni', icon: Truck },
] as const;

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400';

export default function ShopCheckoutPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams({ strict: false }) as { tenantSlug: string };
  const { items, totalPrice, clearCart } = useCartStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { deliveryMethod: 'PICKUP', paymentMethod: 'CASH' },
  });

  const deliveryMethod = form.watch('deliveryMethod');
  const paymentMethod = form.watch('paymentMethod');
  const total = totalPrice();
  const shipping = deliveryMethod === 'DELIVERY' && total < 500000 ? 30000 : 0;
  const grandTotal = total + shipping;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      shopApi.createOrder(tenantSlug, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        deliveryMethod: values.deliveryMethod,
        paymentMethod: values.paymentMethod,
        shippingAddress: values.address ? { address: values.address } : undefined,
        note: values.note,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      }),
    onSuccess: (data: any) => {
      clearCart();
      const orderNumber = data?.orderNumber ?? data?.data?.orderNumber ?? 'unknown';
      navigate({ to: '/shop/$tenantSlug/order/$orderNumber', params: { tenantSlug, orderNumber } });
    },
    onError: () => alert("Xatolik yuz berdi. Qayta urinib ko'ring."),
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Savat bo'sh</p>
        <Link to="/shop/$tenantSlug" params={{ tenantSlug }}>
          <button className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
            Do'konga qaytish
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/shop/$tenantSlug/cart" params={{ tenantSlug }} className="text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Savatga qaytish
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold">Buyurtma rasmiylash</span>
      </div>

      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><User className="h-4 w-4 text-violet-600" /></span>
                Shaxsiy ma'lumotlar
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-gray-400" />
                    Ism familya *
                  </label>
                  <input {...form.register('customerName')} placeholder="Karimov Jasur" className={inputCls} />
                  {form.formState.errors.customerName && <p className="text-xs text-red-500">{form.formState.errors.customerName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-gray-400" />
                    Telefon raqam *
                  </label>
                  <input {...form.register('customerPhone')} placeholder="+998 90 000 00 00" className={inputCls} />
                  {form.formState.errors.customerPhone && <p className="text-xs text-red-500">{form.formState.errors.customerPhone.message}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-gray-400" />
                    Email (ixtiyoriy)
                  </label>
                  <input {...form.register('customerEmail')} type="email" placeholder="email@example.com" className={inputCls} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><Truck className="h-4 w-4 text-violet-600" /></span>
                Yetkazish usuli
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {DELIVERY_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => form.setValue('deliveryMethod', value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${deliveryMethod === value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${deliveryMethod === value ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-bold ${deliveryMethod === value ? 'text-violet-700' : 'text-gray-700'}`}>{label}</span>
                      {deliveryMethod === value && <CheckCircle className="h-4 w-4 text-violet-500 ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </button>
                ))}
              </div>

              {deliveryMethod === 'DELIVERY' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    Yetkazish manzili *
                  </label>
                  <input {...form.register('address')} placeholder="Toshkent sh., Yunusobod t., ..." className={inputCls} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><CreditCard className="h-4 w-4 text-violet-600" /></span>
                To'lov usuli
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map(({ value, label, sub, emoji }) => (
                  <button key={value} type="button" onClick={() => form.setValue('paymentMethod', value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${paymentMethod === value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{emoji}</span>
                      <span className={`text-sm font-bold ${paymentMethod === value ? 'text-violet-700' : 'text-gray-700'}`}>{label}</span>
                      {paymentMethod === value && <CheckCircle className="h-4 w-4 text-violet-500 ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <label className="text-xs font-semibold text-gray-700">Izoh (ixtiyoriy)</label>
              <textarea {...form.register('note')} placeholder="Buyurtma haqida qo'shimcha ma'lumot..." rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 sticky top-24">
              <h2 className="font-extrabold text-gray-900 text-base">Buyurtma ({items.length} ta)</h2>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm opacity-20">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-gray-400">×{item.qty}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-900 shrink-0">{formatCurrency(item.qty * item.unitPrice)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Mahsulotlar</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-violet-400" />Yetkazish</span>
                  {shipping === 0 ? <span className="font-semibold text-green-600">Bepul</span> : <span className="font-semibold">{formatCurrency(shipping)}</span>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-extrabold text-gray-900">Jami</span>
                <span className="text-xl font-extrabold text-violet-700">{formatCurrency(grandTotal)}</span>
              </div>

              <button type="submit" disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60">
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Yuborilmoqda...
                  </span>
                ) : (
                  <>Buyurtma berish<ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
