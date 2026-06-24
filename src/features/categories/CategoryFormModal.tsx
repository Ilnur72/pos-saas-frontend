import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { categoriesApi } from '@/api/tenant.api';

const schema = z.object({
  name: z.string().min(2, 'Kamida 2 ta belgi'),
  parentId: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  sortOrder: number;
  children?: Category[];
  _count?: { products: number };
}

interface Props {
  open: boolean;
  parentId?: string;
  editing?: Category;
  categories: Category[];
  onClose: () => void;
}

function flattenCategories(cats: Category[], result: Category[] = []): Category[] {
  for (const cat of cats) {
    result.push(cat);
    if (cat.children) flattenCategories(cat.children, result);
  }
  return result;
}

export default function CategoryFormModal({ open, parentId, editing, categories, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { sortOrder: 0 },
  });

  useEffect(() => {
    if (open) {
      form.reset(isEdit ? {
        name: editing!.name,
        parentId: editing!.parentId ?? undefined,
        description: editing!.description ?? '',
        sortOrder: editing!.sortOrder,
      } : {
        parentId: parentId ?? undefined,
        sortOrder: 0,
      });
    }
  }, [open, editing, parentId, isEdit, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = { ...values, parentId: values.parentId || undefined };
      return isEdit ? categoriesApi.update(editing!.id, body) : categoriesApi.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: () => alert('Xatolik yuz berdi'),
  });

  const flatCats = flattenCategories(categories).filter((c) => c.id !== editing?.id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nomi *</label>
            <input
              {...form.register('name')}
              placeholder="Kategoriya nomi"
              autoFocus
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Ota-kategoriya</label>
            <select
              value={form.watch('parentId') ?? 'none'}
              onChange={(e) => form.setValue('parentId', e.target.value === 'none' ? undefined : e.target.value)}
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="none">Bosh kategoriya</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tartib raqami</label>
            <input
              type="number"
              {...form.register('sortOrder')}
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tavsif</label>
            <textarea
              {...form.register('description')}
              placeholder="Ixtiyoriy..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
