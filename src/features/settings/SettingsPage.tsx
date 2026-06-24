import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, UserPlus } from 'lucide-react';
import { tenantApi } from '@/api/tenant.api';
import { authApi } from '@/api/auth.api';
import { getStatusLabel } from '@/lib/formatters';
import TelegramSettings from './TelegramSettings';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: tenantMe } = useQuery({ queryKey: ['tenant', 'me'], queryFn: tenantApi.getMe });
  const { data: users } = useQuery({ queryKey: ['tenant', 'users'], queryFn: tenantApi.getUsers });

  const [settings, setSettings] = useState<any>({});
  const [invite, setInvite] = useState({ email: '', role: 'MANAGER' });
  const [inviteSent, setInviteSent] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => tenantApi.updateSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'me'] }),
  });

  const inviteMutation = useMutation({
    mutationFn: () => authApi.invite(invite),
    onSuccess: (data: any) => {
      setInviteSent(data.token ?? '');
      setInvite({ email: '', role: 'MANAGER' });
    },
  });

  const t = tenantMe as any;

  return (
    <div className="space-y-7 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-gray-900">Sozlamalar</h1>

      {/* Store settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Do'kon ma'lumotlari</h2>
        {[
          { key: 'storeName', label: 'Do\'kon nomi', placeholder: t?.name },
          { key: 'storePhone', label: 'Telefon' },
          { key: 'storeAddress', label: 'Manzil' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input
              value={settings[key] ?? (t?.settings as any)?.[key] ?? ''}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        ))}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valyuta</label>
            <select
              value={settings.currency ?? (t?.settings as any)?.currency ?? 'UZS'}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {['UZS', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Til</label>
            <select
              value={settings.language ?? (t?.settings as any)?.language ?? 'uz'}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {[['uz', "O'zbek"], ['ru', 'Русский'], ['en', 'English']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>

      {/* Users */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Foydalanuvchilar</h2>
        <div className="divide-y divide-gray-50">
          {((users as any[]) ?? []).map((tu: any) => (
            <div key={tu.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{tu.user.name}</p>
                <p className="text-xs text-gray-400">{tu.user.email}</p>
              </div>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                {getStatusLabel(tu.role)}
              </span>
            </div>
          ))}
        </div>

        {/* Invite */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Taklif yuborish</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder="email@example.uz"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <select
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {['ADMIN', 'MANAGER', 'CASHIER'].map((r) => <option key={r} value={r}>{getStatusLabel(r)}</option>)}
            </select>
            <button
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending || !invite.email}
              className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Taklif
            </button>
          </div>
          {inviteSent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              Taklif yaratildi. Token: <code className="font-mono text-xs bg-green-100 px-1 rounded">{inviteSent}</code>
            </div>
          )}
        </div>
      </div>

      {/* Telegram bildirishnomalar */}
      <TelegramSettings />
    </div>
  );
}
