'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, X, Star, Sparkles, GripVertical, Package } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  formatVNDPrice,
} from '@/features/pricing';
import { cn } from '@/lib/utils';
import type { PricingTier, CreateTierInput } from '@/types/pricing';

// Sortable feature item component
function SortableFeatureItem({
  id,
  feature,
  onRemove,
}: {
  id: string;
  feature: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2',
        isDragging && 'opacity-50'
      )}
      {...attributes}
    >
      <button
        type="button"
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </button>
      <span className="flex-1 text-sm">{feature}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded hover:text-red-500"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

const tierSchema = z.object({
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  price: z.number().min(0, 'Giá không được âm'),
  priceNote: z.string().optional(),
  currency: z.string().default('VND'),
  billingType: z.string().default('one-time'),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  displayOrder: z.number().min(0).default(0),
  ctaText: z.string().default('Liên hệ tư vấn'),
  ctaLink: z.string().optional(),
  isActive: z.boolean().default(true),
});

type TierFormData = z.infer<typeof tierSchema>;

const billingTypeOptions = [
  { value: 'one-time', label: 'Một lần' },
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'yearly', label: 'Hàng năm' },
];

interface ServiceTiersPanelProps {
  serviceId: string;
  serviceName: string;
  serviceIcon?: React.ReactNode;
}

export function ServiceTiersPanel({ serviceId, serviceName, serviceIcon }: ServiceTiersPanelProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState('');

  const { data: tiers, isLoading } = useTiers(serviceId);
  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof tierSchema>, unknown, z.output<typeof tierSchema>>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      serviceId,
      name: '',
      description: '',
      price: 0,
      priceNote: '',
      currency: 'VND',
      billingType: 'one-time',
      features: [],
      isPopular: false,
      isRecommended: false,
      displayOrder: 0,
      ctaText: 'Liên hệ tư vấn',
      ctaLink: '',
      isActive: true,
    },
  });

  const rawFeatures = watch('features');
  const watchFeatures = Array.isArray(rawFeatures) ? rawFeatures : [];
  const watchPrice = watch('price');

  // VND formatting helpers
  const formatVND = (value: number): string => {
    if (isNaN(value) || value === 0) return '';
    return value.toLocaleString('vi-VN');
  };

  const parseVND = (formatted: string): number => {
    return parseInt(formatted.replace(/\./g, ''), 10) || 0;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    const numericValue = parseInt(rawValue, 10) || 0;
    setValue('price', numericValue);
  };

  // Drag-drop sensors for features
  const featureSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const openCreateDialog = () => {
    setEditingTier(null);
    reset({
      serviceId,
      name: '',
      description: '',
      price: 0,
      priceNote: '',
      currency: 'VND',
      billingType: 'one-time',
      features: [],
      isPopular: false,
      isRecommended: false,
      displayOrder: tiers?.length || 0,
      ctaText: 'Liên hệ tư vấn',
      ctaLink: '',
      isActive: true,
    });
    setNewFeature('');
    setShowDialog(true);
  };

  const openEditDialog = (tier: PricingTier) => {
    setEditingTier(tier);
    reset({
      serviceId: tier.serviceId,
      name: tier.name,
      description: tier.description || '',
      price: parseFloat(tier.price),
      priceNote: tier.priceNote || '',
      currency: tier.currency,
      billingType: tier.billingType,
      features: tier.features || [],
      isPopular: tier.isPopular,
      isRecommended: tier.isRecommended,
      displayOrder: tier.displayOrder,
      ctaText: tier.ctaText,
      ctaLink: tier.ctaLink || '',
      isActive: tier.isActive,
    });
    setNewFeature('');
    setShowDialog(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setValue('features', [...watchFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setValue('features', watchFeatures.filter((_, i) => i !== index));
  };

  const handleFeatureDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = watchFeatures.findIndex((_, i) => `feature-${i}` === active.id);
    const newIndex = watchFeatures.findIndex((_, i) => `feature-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reorderedFeatures = arrayMove(watchFeatures, oldIndex, newIndex);
    setValue('features', reorderedFeatures);
  };

  const onSubmit = async (data: TierFormData) => {
    try {
      if (editingTier) {
        const { serviceId: _, ...updateData } = data;
        await updateTier.mutateAsync({ id: editingTier.id, data: updateData });
        toast.success('Đã cập nhật gói giá');
      } else {
        await createTier.mutateAsync(data as CreateTierInput);
        toast.success('Đã tạo gói giá mới');
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
      await deleteTier.mutateAsync(deleteId);
      toast.success('Đã xóa gói giá');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {serviceIcon || <Package className="w-5 h-5 text-rose-500" />}
          <div>
            <h2 className="text-lg font-semibold">{serviceName}</h2>
            <p className="text-sm text-muted-foreground">Quản lý gói giá</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Thêm gói giá
        </Button>
      </div>

      {/* Tiers Table - without service column */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gói giá</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tính năng</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tiers?.map((tier) => (
              <tr key={tier.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{tier.name}</div>
                  {tier.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{tier.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-rose-600">{formatVNDPrice(tier.price)}</div>
                  {tier.priceNote && <div className="text-xs text-gray-500">{tier.priceNote}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{tier.features?.length || 0} tính năng</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {tier.isPopular && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Star className="w-3 h-3 mr-1" />
                        Phổ biến
                      </Badge>
                    )}
                    {tier.isRecommended && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Đề xuất
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(tier)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(tier.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!tiers || tiers.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500">Chưa có gói giá nào cho dịch vụ này</p>
                    <Button onClick={openCreateDialog} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm gói giá đầu tiên
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Chỉnh sửa gói giá' : 'Thêm gói giá mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên gói *</Label>
              <Input id="name" {...register('name')} placeholder="VD: Basic, Standard, Premium" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" {...register('description')} placeholder="Mô tả ngắn về gói giá..." rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Giá (VND) *</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    value={formatVND(watchPrice)}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    VNĐ
                  </span>
                </div>
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceNote">Ghi chú giá</Label>
                <Input id="priceNote" {...register('priceNote')} placeholder="VD: từ, /tháng" />
              </div>
              <div className="space-y-2">
                <Label>Loại thanh toán</Label>
                <Select value={watch('billingType')} onValueChange={(value) => setValue('billingType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billingTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features Editor */}
            <div className="space-y-2">
              <Label>Tính năng (kéo thả để sắp xếp)</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Nhập tính năng và nhấn Thêm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <DndContext
                sensors={featureSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFeatureDragEnd}
              >
                <SortableContext
                  items={watchFeatures.map((_, i) => `feature-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2 mt-2">
                    {watchFeatures.map((feature, index) => (
                      <SortableFeatureItem
                        key={`feature-${index}`}
                        id={`feature-${index}`}
                        feature={feature}
                        onRemove={() => removeFeature(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch id="isPopular" checked={watch('isPopular')} onCheckedChange={(checked) => setValue('isPopular', checked)} />
                <Label htmlFor="isPopular">Phổ biến</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isRecommended" checked={watch('isRecommended')} onCheckedChange={(checked) => setValue('isRecommended', checked)} />
                <Label htmlFor="isRecommended">Đề xuất</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={watch('isActive')} onCheckedChange={(checked) => setValue('isActive', checked)} />
                <Label htmlFor="isActive">Kích hoạt</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={createTier.isPending || updateTier.isPending}>
                {(createTier.isPending || updateTier.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTier ? 'Cập nhật' : 'Tạo mới'}
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
            Bạn có chắc chắn muốn xóa gói giá này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTier.isPending}
            >
              {deleteTier.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
