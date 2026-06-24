import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Server } from 'lucide-react';
import { superAdminApi } from '@/api/superadmin.api';
import { formatDateTime } from '@/lib/formatters';

export default function SuperAdminSystemPage() {
  const { data: health } = useQuery({ queryKey: ['sa', 'health'], queryFn: superAdminApi.getHealth, refetchInterval: 30000 });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Tizim holati</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time monitoring</p>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Xizmatlar</h2>
        {[
          { label: 'Database (PostgreSQL)', status: health?.database === 'ok' },
          { label: 'API Server (NestJS)', status: !!health },
        ].map(({ label, status }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-200">{label}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${status ? 'text-green-400' : 'text-red-400'}`}>
              <CheckCircle className="h-3.5 w-3.5" />
              {status ? 'Ishlayapti' : 'Xato'}
            </div>
          </div>
        ))}
        {health?.timestamp && (
          <p className="text-xs text-slate-500">Oxirgi yangilanish: {formatDateTime(health.timestamp)}</p>
        )}
      </div>
    </div>
  );
}
