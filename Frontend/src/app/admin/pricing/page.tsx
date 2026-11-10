'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, Globe, MessageSquare, Smartphone, Wrench, GripVertical, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleService,
  useCategories,
  generateSlug,
} from '@/features/pricing';
import { cn } from '@/lib/utils';
import type { Service, CreateServiceInput } from '@/types/pricing';
import { ServiceTiersPanel } from './components/ServiceTiersPanel';

// Sortable row component for services table
function SortableServiceRow({
  service,
  iconOptions,
  onEdit,
  onDelete,
  onToggle,
  onRowClick
}: {
  service: Service;
  iconOptions: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onRowClick: (service: Service) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconOptions.find(i => i.value === service.icon)?.icon || Globe;

  const handleRowClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the row itself, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="switch"]')) {
      return;
    }
    onRowClick(service);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'hover:bg-muted/50 cursor-pointer transition-colors',
        isDragging && 'opacity-50 bg-gray-100 dark:bg-gray-800'
      )}
      onClick={handleRowClick}
      {...attributes}
    >
      <td className="px-4 py-3 w-10">
        <button
          {...listeners}
          onClick={(e) => e.stopPropagation()}
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
            <div className="font-medium">{service.name}</div>
            {service.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {service.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{service.slug}</td>
      <td className="px-4 py-3">
        <Switch
          checked={service.isActive}
          onCheckedChange={() => onToggle(service.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(service); }}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </td>
    </tr>
  );
}

const serviceSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const iconOptions = [
  { value: 'globe', label: 'Website', icon: Globe },
  { value: 'message-square', label: 'Zalo Mini App', icon: MessageSquare },
  { value: 'smartphone', label: 'Mobile App', icon: Smartphone },
  { value: 'wrench', label: 'Custom Tool', icon: Wrench },
];

export default function AdminPricingServicesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  // Sheet state for tiers panel
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: services, isLoading } = useServices();
  const { data: categories } = useCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const toggleService = useToggleService();

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
  } = useForm<z.input<typeof serviceSchema>, unknown, z.output<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: 'globe',
      displayOrder: 0,
      isActive: true,
    },
  });

  const openCreateDialog = () => {
    setEditingService(null);
    reset({
      name: '',
      slug: '',
      description: '',
      icon: 'globe',
      displayOrder: services?.length || 0,
      isActive: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      icon: service.icon || 'globe',
      displayOrder: service.displayOrder,
      isActive: service.isActive,
    });
    setShowDialog(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data });
        toast.success('Đã cập nhật dịch vụ');
      } else {
        await createService.mutateAsync(data as CreateServiceInput);
        toast.success('Đã tạo dịch vụ mới');
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
      await deleteService.mutateAsync(deleteId);
      toast.success('Đã xóa dịch vụ');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleService.mutateAsync(id);
      toast.success('Đã cập nhật trạng thái');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!editingService) {
      setValue('slug', generateSlug(name));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !services) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedServices = arrayMove(services, oldIndex, newIndex);

    // Update displayOrder for all affected services
    try {
      const updatePromises = reorderedServices.map((service, index) => {
        if (service.displayOrder !== index) {
          return updateService.mutateAsync({
            id: service.id,
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

  // Filter services by selected category
  const filteredServices = services?.filter((service) => {
    if (selectedCategoryId === 'all') return true;
    return service.categoryId === selectedCategoryId;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý dịch vụ</h1>
          <p className="text-gray-500">Quản lý các loại dịch vụ hiển thị trên trang bảng giá</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm dịch vụ
          </Button>
        </div>
      </div>

      {/* Services Table */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dịch vụ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredServices && filteredServices.length > 0 && (
                <SortableContext
                  items={filteredServices.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredServices.map((service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
                      iconOptions={iconOptions}
                      onEdit={openEditDialog}
                      onDelete={setDeleteId}
                      onToggle={handleToggle}
                      onRowClick={(s) => {
                        setSelectedService(s);
                        setSheetOpen(true);
                      }}
                    />
                  ))}
                </SortableContext>
              )}
              {(!filteredServices || filteredServices.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {selectedCategoryId === 'all'
                      ? 'Chưa có dịch vụ nào. Nhấn "Thêm dịch vụ" để bắt đầu.'
                      : 'Không có dịch vụ nào trong danh mục này.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dịch vụ *</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={handleNameChange}
                placeholder="VD: Thiết kế Website"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="thiet-ke-website"
              />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Mô tả ngắn về dịch vụ..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={watch('icon')}
                onValueChange={(value) => setValue('icon', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Kích hoạt</Label>
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
              <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                {(createService.isPending || updateService.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingService ? 'Cập nhật' : 'Tạo mới'}
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
            Bạn có chắc chắn muốn xóa dịch vụ này? Tất cả gói giá liên quan cũng sẽ bị xóa.
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Tiers Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-[800px] w-full overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedService?.name || 'Gói giá'}</SheetTitle>
            <SheetDescription>Quản lý gói giá cho dịch vụ</SheetDescription>
          </SheetHeader>
          {selectedService && (
            <ServiceTiersPanel
              serviceId={selectedService.id}
              serviceName={selectedService.name}
              serviceIcon={
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                  {(() => {
                    const IconComponent = iconOptions.find(i => i.value === selectedService.icon)?.icon || Globe;
                    return <IconComponent className="w-5 h-5 text-rose-500" />;
                  })()}
                </div>
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}