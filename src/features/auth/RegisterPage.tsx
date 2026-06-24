import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Zap } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ ownerName: '', email: '', password: '', tenantName: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.register(form);
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.tenant.slug, 'OWNER', data.tenant);
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        required={key !== 'phone'}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 bg-violet-600 text-white px-4 py-2.5 rounded-2xl shadow-lg mb-4">
            <Zap className="h-5 w-5 fill-white" />
            <span className="font-bold text-lg">Warehouse SaaS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Do'kon ochish</h1>
          <p className="text-gray-500 text-sm mt-1">14 kun bepul sinov davri</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-4">
          {field('tenantName', "Do'kon nomi", 'text', 'Al-Baraka Market')}
          {field('ownerName', 'Ism-familiya', 'text', 'Alisher Karimov')}
          {field('email', 'Email', 'email', 'email@example.uz')}
          {field('phone', 'Telefon (ixtiyoriy)', 'tel', '+998 90 123 45 67')}
          {field('password', 'Parol', 'password', '••••••••')}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? 'Yaratilmoqda...' : "Do'kon ochish — Bepul"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Hisobingiz bormi?{' '}
            <a href="/login" className="text-violet-600 font-semibold hover:underline">Kirish</a>
          </p>
        </form>
      </div>
    </div>
  );
}
