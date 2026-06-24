import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Building2, Search, MoreVertical, ChevronRight, Pause, Play, TrendingUp, RefreshCw } from 'lucide-react';
import { superAdminApi } from '@/api/superadmin.api';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/formatters';
import { UsageBar } from '@/components/ui/UsageBar';

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-700 text-gray-300',
  STARTER: 'bg-blue-900/60 text-blue-300',
  PRO: 'bg-violet-900/60 text-violet-300',
  ENTERPRISE: 'bg-amber-900/60 text-amber-300',
};

export default function SuperAdminTenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sa', 'tenants', search, statusFilter, planFilter],
    queryFn: () => superAdminApi.getTenants({ search: search || undefined, status: statusFilter || undefined, plan: planFilter || undefined }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => superAdminApi.suspendTenant(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa', 'tenants'] }); setSelected(null); },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.activateTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa', 'tenants'] }); setSelected(null); },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => superAdminApi.extendTrial(id, days),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa', 'tenants'] }),
  });

  const tenants: any[] = (data as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Tenantlar</h1>
          <p className="text-slate-400 text-sm mt-0.5">{(data as any)?.meta?.total ?? 0} ta do'kon</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder-slate-500"
          />
        </div>
        {[['', 'Barchasi'], ['TRIAL', 'Sinov'], ['ACTIVE', 'Faol'], ['SUSPENDED', 'To\'xtatilgan']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${statusFilter === v ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {['Do\'kon', 'Plan', 'Holat', 'Foydalanuvchilar', 'Ro\'yxat', 'Amallar'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">Yuklanmoqda...</td></tr>
            ) : tenants.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{t.slug}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[t.plan] ?? 'bg-slate-700 text-slate-400'}`}>{t.plan}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(t.status)}`}>{getStatusLabel(t.status)}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-300">{t._count?.users ?? 0}</td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(t.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <Link to="/superadmin/tenants/$id" params={{ id: t.id }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    {t.status === 'SUSPENDED' ? (
                      <button onClick={() => activateMutation.mutate(t.id)}
                        className="p-1.5 text-green-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Play className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => { const r = prompt('Sabab:'); if (r) suspendMutation.mutate({ id: t.id, reason: r }); }}
                        className="p-1.5 text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    {t.status === 'TRIAL' && (
                      <button onClick={() => extendMutation.mutate({ id: t.id, days: 7 })}
                        className="p-1.5 text-amber-400 hover:bg-slate-700 rounded-lg transition-colors" title="+7 kun">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
