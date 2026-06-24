import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { categoriesApi } from '@/api/tenant.api';
import PageHeader from '@/components/common/PageHeader';
import { useConfirmDialog } from '@/components/common/ConfirmDialog';
import CategoryFormModal, { type Category } from './CategoryFormModal';

function CategoryNode({
  category,
  level,
  onEdit,
  onAddChild,
  onDelete,
}: {
  category: Category;
  level: number;
  onEdit: (c: Category) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (c: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (category.children?.length ?? 0) > 0;
  const productsCount = category._count?.products ?? 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        <button
          className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
        </button>

        <FolderOpen className="h-4 w-4 text-gray-400 shrink-0" />

        <span className="text-sm font-medium text-gray-900 flex-1">{category.name}</span>

        {category._count && (
          <span className="text-xs text-gray-400 mr-2">{productsCount} mahsulot</span>
        )}

        <span className="text-xs text-gray-300 mr-2">#{category.sortOrder}</span>

        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => onAddChild(category.id)}
            title="Sub-kategoriya qo'shish"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => onEdit(category)}
            title="Tahrirlash"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            onClick={() => onDelete(category)}
            disabled={hasChildren || productsCount > 0}
            title="O'chirish"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && category.children?.map((child) => (
        <CategoryNode
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modalState, setModalState] = useState<{ open: boolean; parentId?: string; editing?: Category }>({ open: false });
  const { confirm, dialog } = useConfirmDialog();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoriesApi.getTree(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => alert("O'chirishda xatolik"),
  });

  const handleDelete = (category: Category) => {
    confirm({
      title: "Kategoriyani o'chirish",
      description: `"${category.name}" kategoriyasini o'chirishni tasdiqlaysizmi?`,
      confirmLabel: "O'chirish",
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(category.id),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kategoriyalar"
        description="Mahsulot kategoriyalarini boshqarish"
        action={
          <button
            onClick={() => setModalState({ open: true })}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Kategoriya qo'shish
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Yuklanmoqda...</div>
        ) : !categories?.length ? (
          <div className="py-8 text-center text-sm text-gray-400">Kategoriyalar yo'q</div>
        ) : (
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                level={0}
                onEdit={(c) => setModalState({ open: true, editing: c })}
                onAddChild={(parentId) => setModalState({ open: true, parentId })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryFormModal
        open={modalState.open}
        parentId={modalState.parentId}
        editing={modalState.editing}
        categories={categories ?? []}
        onClose={() => setModalState({ open: false })}
      />

      {dialog}
    </div>
  );
}
