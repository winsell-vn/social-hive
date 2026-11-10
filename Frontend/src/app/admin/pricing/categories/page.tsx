'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, GripVertical, Globe, Megaphone, Smartphone, Code, Palette, Sparkles, FolderOpen, Package } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  pricingAdminKeys,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategory,
  generateSlug,
} from '@/features/pricing';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ServiceCategoryAdmin, CreateCategoryInput } from '@/types/pricing';

const iconOptions = [
  { value: 'Globe', label: 'Website & Tên Miền', icon: Globe },
  { value: 'Megaphone', label: 'Marketing', icon: Megaphone },
  { value: 'Smartphone', label: 'Di Động', icon: Smartphone },
  { value: 'Code', label: 'Phần Mềm', icon: Code },
  { value: 'Palette', label: 'Thiết Kế', icon: Palette },
  { value: 'Sparkles', label: 'AI & Tự Động', icon: Sparkles },
  { value: 'Package', label: 'Combo', icon: Package },
  { value: 'FolderOpen', label: 'Khác', icon: FolderOpen },
];

function getIconComponent(iconName: string | null) {
  return iconOptions.find(i => i.value === iconName)?.icon || FolderOpen;
}



function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: ServiceCategoryAdmin;
  onEdit: (cat: ServiceCategoryAdmin) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = getIconComponent(category.icon);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-900/50',
        isDragging && 'opacity-50 bg-gray-100 dark:bg-gray-800'
      )}
      {...attributes}
    >
      <td className="px-4 py-3 w-10">
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10">
            <IconComponent className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="font-medium">{category.name}</div>
            {category.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {category.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{category.slug}</td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">
        {category._count?.services ?? 0}
      </td>
      <td className="px-4 py-3">
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggle(category.id)}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

const categorySchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminPricingCategoriesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryAdmin | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const toggleCategory = useToggleCategory();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof categorySchema>, unknown, z.output<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: 'FolderOpen',
      displayOrder: 0,
      isActive: true,
    },
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    reset({
      name: '',
      slug: '',
      description: '',
      icon: 'FolderOpen',
      displayOrder: categories?.length || 0,
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (category: ServiceCategoryAdmin) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || 'FolderOpen',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setShowDialog(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data });
        toast.success('Đã cập nhật danh mục');
      } else {
        await createCategory.mutateAsync(data as CreateCategoryInput);
        toast.success('Đã tạo danh mục mới');
      }
      setShowDialog(false);
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      toast.success('Đã xóa danh mục');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleCategory.mutateAsync(id);
      toast.success('Đã cập nhật trạng thái');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!editingCategory) {
      setValue('slug', generateSlug(name));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    try {
      // Use direct API calls to avoid N query invalidations from mutation hooks
      await Promise.all(
        reordered
          .filter((cat, index) => cat.displayOrder !== index)
          .map((cat) => {
            const newOrder = reordered.indexOf(cat);
            return apiClient.put(`/pricing/categories/${cat.id}`, { displayOrder: newOrder });
          })
      );
      // Invalidate queries once after all updates complete
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.categories() });
      toast.success('Đã cập nhật thứ tự');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi cập nhật thứ tự');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh mục dịch vụ hiển thị trên trang báo giá
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-500">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left font-medium">Danh mục</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-center font-medium">Dịch vụ</th>
                <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={categories?.map((c) => c.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {categories?.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={openEditDialog}
                    onDelete={(id) => setDeleteId(id)}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>

        {(!categories || categories.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có danh mục nào</p>
            <Button variant="link" onClick={openCreateDialog} className="mt-2">
              Tạo danh mục đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={handleNameChange}
                placeholder="VD: Thiết kế website"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="VD: thiet-ke-website"
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Mô tả ngắn về danh mục"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={watch('icon') || 'FolderOpen'}
                onValueChange={(val) => setValue('icon', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Thứ tự</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register('displayOrder', { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  checked={watch('isActive')}
                  onCheckedChange={(val) => setValue('isActive', val)}
                />
                <Label>Hiển thị</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}