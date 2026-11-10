'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, HelpCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EditorSkeleton } from '@/components/loading';
import {
  useFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
} from '@/features/pricing';
import { cn } from '@/lib/utils';
import type { PricingFAQ, CreateFaqInput } from '@/types/pricing';

// Dynamic import RichTextEditor with SSR disabled (TipTap doesn't support SSR)
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton minHeight="min-h-[150px]" showToolbar={true} />
  }
);

// Sortable row component for FAQs table
function SortableFaqRow({
  faq,
  onEdit,
  onDelete,
}: {
  faq: PricingFAQ;
  onEdit: (faq: PricingFAQ) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 mt-0.5">
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium line-clamp-1">{faq.question}</div>
            <div className="text-sm text-gray-500 line-clamp-2 mt-1">{faq.answer}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{faq.category || '-'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {faq.isActive ? 'Hiển thị' : 'Ẩn'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(faq)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(faq.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

const faqSchema = z.object({
  question: z.string().min(5, 'Câu hỏi phải có ít nhất 5 ký tự'),
  answer: z.string().min(10, 'Câu trả lời phải có ít nhất 10 ký tự'),
  category: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type FaqFormData = z.infer<typeof faqSchema>;

export default function AdminPricingFaqsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<PricingFAQ | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: faqs, isLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  // Drag-drop sensors
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
  } = useForm<z.input<typeof faqSchema>, unknown, z.output<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: '',
      displayOrder: 0,
      isActive: true,
    },
  });

  const openCreateDialog = () => {
    setEditingFaq(null);
    reset({
      question: '',
      answer: '',
      category: '',
      displayOrder: faqs?.length || 0,
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (faq: PricingFAQ) => {
    setEditingFaq(faq);
    reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      displayOrder: faq.displayOrder,
      isActive: faq.isActive,
    });
    setShowDialog(true);
  };

  const onSubmit = async (data: FaqFormData) => {
    try {
      if (editingFaq) {
        await updateFaq.mutateAsync({ id: editingFaq.id, data });
        toast.success('Đã cập nhật FAQ');
      } else {
        await createFaq.mutateAsync(data as CreateFaqInput);
        toast.success('Đã tạo FAQ mới');
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
      await deleteFaq.mutateAsync(deleteId);
      toast.success('Đã xóa FAQ');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !faqs) return;

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedFaqs = arrayMove(faqs, oldIndex, newIndex);

    // Update displayOrder for all affected FAQs
    try {
      const updatePromises = reorderedFaqs.map((faq, index) => {
        if (faq.displayOrder !== index) {
          return updateFaq.mutateAsync({
            id: faq.id,
            data: { displayOrder: index },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success('Đã cập nhật thứ tự');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi cập nhật thứ tự');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý FAQ</h1>
          <p className="text-gray-500">Quản lý các câu hỏi thường gặp trên trang bảng giá</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm FAQ
        </Button>
      </div>

      {/* FAQs Table */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Câu hỏi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {faqs && faqs.length > 0 && (
                <SortableContext
                  items={faqs.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {faqs.map((faq) => (
                    <SortableFaqRow
                      key={faq.id}
                      faq={faq}
                      onEdit={openEditDialog}
                      onDelete={setDeleteId}
                    />
                  ))}
                </SortableContext>
              )}
              {(!faqs || faqs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Chưa có FAQ nào. Nhấn &quot;Thêm FAQ&quot; để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Câu hỏi *</Label>
              <Input
                id="question"
                {...register('question')}
                placeholder="VD: Thời gian hoàn thành dự án là bao lâu?"
              />
              {errors.question && <p className="text-sm text-red-500">{errors.question.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Câu trả lời *</Label>
              <RichTextEditor
                content={watch('answer')}
                onChange={(content) => setValue('answer', content)}
                placeholder="Nhập câu trả lời chi tiết..."
                showToolbar={true}
                minHeight="min-h-[150px]"
              />
              {errors.answer && <p className="text-sm text-red-500">{errors.answer.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="VD: Thanh toán, Hỗ trợ"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Hiển thị</Label>
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createFaq.isPending || updateFaq.isPending}>
                {(createFaq.isPending || updateFaq.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingFaq ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa FAQ này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteFaq.isPending}
            >
              {deleteFaq.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

