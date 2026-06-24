import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', tenantSlug: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login(form);
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, form.tenantSlug, data.role ?? 'OWNER', data.tenant);
      navigate({ to: '/' });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data?.error?.message ?? err.message ?? 'Xatolik yuz berdi';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 bg-violet-600 text-white px-4 py-2.5 rounded-2xl shadow-lg mb-4">
            <Zap className="h-5 w-5 fill-white" />
            <span className="font-bold text-lg">Warehouse SaaS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Do'konga kirish</h1>
          <p className="text-gray-500 text-sm mt-1">Do'kon slugi, email va parol kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Do'kon slug</label>
            <input
              type="text"
              value={form.tenantSlug}
              onChange={(e) => setForm({ ...form, tenantSlug: e.target.value })}
              placeholder="mening-dokonim"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.uz"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Hisobingiz yo'qmi?{' '}
            <a href="/register" className="text-violet-600 font-semibold hover:underline">Ro'yxatdan o'tish</a>
          </p>
        </form>
      </div>
    </div>
  );
}
