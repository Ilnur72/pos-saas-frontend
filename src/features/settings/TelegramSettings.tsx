import { useState, useEffect } from 'react';
import { Send, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { telegramApi } from '@/api/tenant.api';

export default function TelegramSettings() {
  const [config, setConfig] = useState({ botToken: '', chatId: '', enabled: false });
  const [hasGlobalBot, setHasGlobalBot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    telegramApi.getConfig()
      .then((c: any) => {
        setConfig({ botToken: c.botToken ?? '', chatId: c.chatId ?? '', enabled: c.enabled ?? false });
        setHasGlobalBot(c.hasGlobalBot);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setResult(null);
    try {
      await telegramApi.saveConfig({
        botToken: config.botToken || undefined,
        chatId: config.chatId,
        enabled: config.enabled,
      });
      setResult({ success: true, message: 'Saqlandi' });
    } catch (e: any) {
      setResult({ success: false, message: e.response?.data?.message ?? 'Xatolik' });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await telegramApi.test();
      setResult({
        success: r.sent,
        message: r.sent ? 'Test xabar yuborildi! Telegramni tekshiring' : 'Yuborilmadi — sozlamalarni tekshiring',
      });
    } catch (e: any) {
      setResult({ success: false, message: e.response?.data?.message ?? 'Xatolik' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-400">Yuklanmoqda...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Telegram bildirishnomalar
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Smena yopilishi, kam qoldiq haqida xabar</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-500 rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-bold text-blue-900">📋 Sozlash bo'yicha yo'riqnoma:</p>
        <ol className="text-blue-800 space-y-1 list-decimal list-inside text-xs">
          <li>Telegramda <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="font-semibold underline">@BotFather</a> ga kiring, <code className="bg-blue-100 px-1 rounded">/newbot</code> buyrug'i bilan yangi bot yarating</li>
          <li>Bot tokenini olib pastdagi maydonga qo'ying (yoki tizim umumiy botini ishlatadi)</li>
          <li>Botingiz bilan suhbatda <code className="bg-blue-100 px-1 rounded">/start</code> yozing</li>
          <li>Chat ID olish uchun <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="font-semibold underline">@userinfobot</a> ga <code className="bg-blue-100 px-1 rounded">/start</code> yozing</li>
        </ol>
      </div>

      {!hasGlobalBot && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bot token</label>
          <input
            type="password"
            value={config.botToken}
            onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
            placeholder="1234567890:ABCdefGhIjKlMnOpQrStUvWxYz"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      {hasGlobalBot && !config.botToken && (
        <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          ✓ Tizim umumiy botini ishlatadi (qo'shimcha bot tokeni shart emas)
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chat ID *</label>
        <input
          value={config.chatId}
          onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
          placeholder="123456789"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Egasi/menejerning Telegram chat ID si</p>
      </div>

      {result && (
        <div className={`rounded-xl px-3 py-2 text-sm flex items-center gap-2 ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {result.message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving || !config.chatId}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
        <button
          onClick={test}
          disabled={testing || !config.enabled || !config.chatId}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {testing ? 'Yuborilyapti...' : 'Test xabar'}
        </button>
      </div>
    </div>
  );
}
