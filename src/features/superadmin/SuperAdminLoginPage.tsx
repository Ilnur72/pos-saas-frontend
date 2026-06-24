import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Shield } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { setSuperAdminToken } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.superAdminLogin(form);
      setSuperAdminToken(data.accessToken);
      navigate({ to: '/superadmin' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-slate-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Super Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Platforma boshqaruvi</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl border border-slate-700 p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-slate-500"
              placeholder="admin@warehouse.uz"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Parol</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-slate-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
