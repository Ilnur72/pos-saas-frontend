import { format, formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}
export function formatDate(d: string | Date) {
  return format(new Date(d), 'dd.MM.yyyy', { locale: uz });
}
export function formatDateTime(d: string | Date) {
  return format(new Date(d), 'dd.MM.yyyy HH:mm', { locale: uz });
}
export function formatRelative(d: string | Date) {
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: uz });
}
export function formatNumber(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n);
}

const STATUS_LABELS: Record<string, string> = {
  FREE: 'Bepul', STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise',
  TRIAL: 'Sinov', ACTIVE: 'Faol', SUSPENDED: 'To\'xtatilgan', CANCELLED: 'Bekor',
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlangan', PROCESSING: 'Jarayonda',
  SHIPPED: 'Yuborilgan', DELIVERED: 'Yetkazilgan', REFUNDED: 'Qaytarilgan',
  PAID: "To'langan", UNPAID: "To'lanmagan", PARTIAL: 'Qisman',
  OWNER: 'Egasi', ADMIN: 'Admin', MANAGER: 'Menejer', CASHIER: 'Kassir',
  CASH: 'Naqd', PAYME: 'Payme', CLICK: 'Click', UZUM: 'Uzum',
  PICKUP: 'Olib ketish', DELIVERY: 'Yetkazib berish',
};
export function getStatusLabel(s: string) { return STATUS_LABELS[s] ?? s; }

const STATUS_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO: 'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
  TRIAL: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
};
export function getStatusColor(s: string) { return STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-600'; }
