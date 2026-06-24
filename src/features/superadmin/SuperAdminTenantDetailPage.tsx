import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Users, ShoppingCart, Package } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { superAdminApi } from '@/api/superadmin.api';
import { UsageBar } from '@/components/ui/UsageBar';
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/formatters';

const PLAN_OPTIONS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

export default function SuperAdminTenantDetailPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['sa', 'tenant', id],
    queryFn: () => superAdminApi.getTenant(id),
  });

  const changePlanMutation = useMutation({
    mutationFn: (plan: string) => superAdminApi.changePlan(id, plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'tenant', id] }),
  });

  if (isLoading) return <div className="text-slate-400">Yuklanmoqda...</div>;
  if (!tenant) return <div className="text-slate-400">Topilmadi</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/superadmin/tenants" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{tenant.name}</h1>
          <p className="text-slate-400 text-sm font-mono">{tenant.slug}</p>
        </div>
        <span className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(tenant.status)}`}>
          {getStatusLabel(tenant.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Info */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Ma'lumotlar</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Plan</span>
              <select
                value={tenant.plan}
                onChange={(e) => changePlanMutation.mutate(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs"
              >
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ro'yxat sanasi</span>
              <span className="text-slate-200">{formatDate(tenant.createdAt)}</span>
            </div>
            {tenant.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Sinov tugash</span>
                <span className="text-slate-200">{formatDate(tenant.trialEndsAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Foydalanuvchilar</span>
              <span className="text-slate-200">{tenant.users?.length ?? 0} ta</span>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Foydalanish</h2>
          {tenant.usage && (
            <div className="space-y-4">
              <UsageBar label="SKU" {...tenant.usage.skus} />
              <UsageBar label="Foydalanuvchilar" {...tenant.usage.users} />
              <UsageBar label="Buyurtmalar (oy)" {...tenant.usage.orders} />
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">So'nggi invoicelar</h2>
          {tenant.invoices?.length ? (
            <div className="space-y-2">
              {tenant.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 text-sm">
                  <span className="text-slate-300">{formatDate(inv.createdAt)}</span>
                  <span className="text-slate-400">{inv.paymentMethod ?? '—'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(inv.status)}`}>{getStatusLabel(inv.status)}</span>
                  <span className="text-white font-semibold">{formatCurrency(Number(inv.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Invoicelar yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}
