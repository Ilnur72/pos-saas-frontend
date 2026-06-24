import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Zap } from 'lucide-react';
import { billingApi } from '@/api/tenant.api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/formatters';
import { useAuthStore } from '@/stores/auth.store';

const PLAN_FEATURES: Record<string, string[]> = {
  FREE:       ['100 SKU', '2 foydalanuvchi', '50 ta buyurtma/oy', 'Asosiy hisobotlar'],
  STARTER:    ['1,000 SKU', '5 foydalanuvchi', '500 ta buyurtma/oy', 'Excel import', 'Email xabarlar'],
  PRO:        ['10,000 SKU', '15 foydalanuvchi', '5,000 ta buyurtma/oy', 'ABC tahlil', 'Payme integratsiya', 'API kirish'],
  ENTERPRISE: ['Cheksiz SKU', '99 foydalanuvchi', 'Cheksiz buyurtma', 'Maxsus integratsiya', 'Dedicated support'],
};

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 99000, PRO: 299000, ENTERPRISE: 799000 };

export default function BillingPage() {
  const qc = useQueryClient();
  const { tenant } = useAuthStore();
  const { data: plans } = useQuery({ queryKey: ['billing', 'plans'], queryFn: billingApi.getPlans });
  const { data: current } = useQuery({ queryKey: ['billing', 'current'], queryFn: billingApi.getCurrent });
  const { data: invoices } = useQuery({ queryKey: ['billing', 'invoices'], queryFn: () => billingApi.getInvoices() });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => billingApi.upgrade(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: billingApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });

  const currentPlan = tenant?.plan ?? 'FREE';

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Billing va Obuna</h1>
        <p className="text-gray-500 text-sm mt-0.5">Joriy plan: <strong>{currentPlan}</strong></p>
      </div>

      {/* Subscription status */}
      {(current as any)?.subscription && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Joriy obuna</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate((current as any).subscription.currentPeriodStart)} — {formatDate((current as any).subscription.currentPeriodEnd)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor((current as any).subscription.status)}`}>
                {getStatusLabel((current as any).subscription.status)}
              </span>
              {(current as any).subscription.status === 'ACTIVE' && (
                <button
                  onClick={() => { if (confirm('Bekor qilasizmi?')) cancelMutation.mutate(); }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as const).map((plan) => {
          const isCurrent = currentPlan === plan;
          const isPro = plan === 'PRO';
          return (
            <div key={plan} className={`bg-white rounded-2xl border-2 shadow-sm p-6 flex flex-col gap-4 transition-all ${isPro ? 'border-violet-500 shadow-violet-100' : isCurrent ? 'border-gray-300' : 'border-gray-100'}`}>
              {isPro && (
                <div className="flex justify-center -mt-9 mb-1">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Tavsiya</span>
                </div>
              )}
              <div>
                <p className="text-lg font-extrabold text-gray-900">{plan}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">
                  {PLAN_PRICES[plan] === 0 ? 'Bepul' : formatCurrency(PLAN_PRICES[plan])}
                  {PLAN_PRICES[plan] > 0 && <span className="text-sm font-medium text-gray-400">/oy</span>}
                </p>
              </div>
              <ul className="space-y-1.5 flex-1">
                {PLAN_FEATURES[plan].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold">Joriy plan</div>
              ) : (
                <button
                  onClick={() => upgradeMutation.mutate(plan)}
                  disabled={upgradeMutation.isPending}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${isPro ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  {upgradeMutation.isPending ? '...' : plan === 'FREE' ? 'Bepulga o\'tish' : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">To'lov tarixi</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {((invoices as any)?.data ?? []).map((inv: any) => (
            <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(inv.createdAt)}</p>
                <p className="text-xs text-gray-400">{inv.paymentMethod ?? '—'}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(inv.status)}`}>{getStatusLabel(inv.status)}</span>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(inv.amount))}</p>
            </div>
          ))}
          {!((invoices as any)?.data?.length) && (
            <p className="text-sm text-gray-400 text-center py-8">To'lovlar yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}
