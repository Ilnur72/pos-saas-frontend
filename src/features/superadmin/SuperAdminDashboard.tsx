import { useQuery } from '@tanstack/react-query';
import { Building2, TrendingUp, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { superAdminApi } from '@/api/superadmin.api';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency } from '@/lib/formatters';

const PLAN_COLORS = { FREE: '#94a3b8', STARTER: '#60a5fa', PRO: '#8b5cf6', ENTERPRISE: '#f59e0b' };

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['sa', 'stats'], queryFn: superAdminApi.getStats });
  const { data: mrrChart } = useQuery({ queryKey: ['sa', 'mrr-chart'], queryFn: () => superAdminApi.getMrrChart(12) });

  if (isLoading) return <div className="text-slate-400 text-sm">Yuklanmoqda...</div>;

  const planDist = stats?.planDistribution
    ? Object.entries(stats.planDistribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platforma umumiy holati</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Jami tenantlar</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">{stats?.totalTenants ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stats?.newTenantsThisWeek ?? 0} bu hafta yangi</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Faol</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">{stats?.activeTenants ?? 0}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Sinov davrida</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">{stats?.trialTenants ?? 0}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-900/50 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">To'xtatilgan</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">{stats?.suspendedTenants ?? 0}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-900/60 to-indigo-900/60 rounded-2xl border border-violet-700/50 p-5 flex items-start gap-4 col-span-2 xl:col-span-1">
          <div className="w-12 h-12 bg-violet-800/60 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <p className="text-sm text-violet-300 font-medium">MRR (bu oy)</p>
            <p className="text-3xl font-extrabold text-white mt-0.5">{formatCurrency(stats?.mrr ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* MRR Chart */}
        <div className="xl:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-base font-bold text-white mb-4">MRR o'sishi (12 oy)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrChart ?? []}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-base font-bold text-white mb-4">Plan taqsimoti</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {planDist.map((entry) => (
                  <Cell key={entry.name} fill={PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS] ?? '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {planDist.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[p.name as keyof typeof PLAN_COLORS] ?? '#64748b' }} />
                  <span className="text-slate-300">{p.name}</span>
                </div>
                <span className="text-slate-400 font-semibold">{p.value as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
