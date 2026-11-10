'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink, Image as ImageIcon, ChevronDown, ChevronUp, Link2, Settings, Loader2, X, AlertCircle, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditorSkeleton } from '@/components/loading';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useAds, useCreateAd, useUpdateAd, useDeleteAd, useToggleAdStatus, useAdsAnalytics } from '@/features/ads';
import type { Ad, CreateAdInput, AdPlacement } from '@/types/ad';
import { transformImageUrl } from '@/lib/image-url';

// Dynamic import RichTextEditor with SSR disabled (TipTap doesn't support SSR)
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton minHeight="min-h-[120px]" showToolbar={false} />
  }
);

// Strip HTML tags for character count (client-side only)
function getTextContent(html: string): string {
  if (typeof window === 'undefined') return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const initialFormData: CreateAdInput = {
  title: '',
  description: '',
  imageUrl: '',
  ctaText: 'Tìm hiểu thêm',
  ctaLink: '',
  placement: 'FEED',
  isActive: true,
  priority: 0,
};

export default function AdsManagementPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<CreateAdInput>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();
  const toggleStatus = useToggleAdStatus();
  const { data: analytics } = useAdsAnalytics();

  const ads = data?.pages.flatMap((page) => page.data) ?? [];

  // Character count for description
  const descriptionText = getTextContent(formData.description || '');
  const characterCount = descriptionText.length;
  const isCharacterWarning = characterCount >= 450 && characterCount < 500;
  const isCharacterError = characterCount >= 500;

  // Validate image file
  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Chỉ hỗ trợ JPG, PNG, GIF, WebP';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Ảnh không được vượt quá 5MB';
    }
    return null;
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const response = await apiClient.post<{ url: string }>('/upload/image', formDataUpload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url;
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    setUploadError(null);

    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast.error(validationError);
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Đã tải ảnh lên');
    } catch (error) {
      const errorMsg = 'Không thể tải ảnh lên. Vui lòng thử lại.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  // Handle paste image (Ctrl+V) for the editor
  const handlePasteImage = useCallback(async (file: File): Promise<string> => {
    // This is for images pasted into the editor content
    // For ad form, we want to set the main image URL instead
    await handleImageUpload(file);
    return ''; // Return empty - we don't want to insert into editor
  }, [handleImageUpload]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the dropzone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        toast.error('Vui lòng chọn file ảnh');
      }
    }
  }, [handleImageUpload]);

  // Global paste handler for Ctrl+V outside editor
  useEffect(() => {
    if (!showComposer) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't handle if focus is in the editor (editor handles its own paste)
      const activeElement = document.activeElement;
      if (activeElement?.closest('.ProseMirror')) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [showComposer, handleImageUpload]);

  const handleOpenCreate = () => {
    setEditingAd(null);
    setFormData(initialFormData);
    setShowAdvancedSettings(false);
    setUploadError(null);
    setShowComposer(true);
  };

  const handleOpenEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink,
      placement: ad.placement,
      isActive: ad.isActive,
      priority: ad.priority,
    });
    setShowAdvancedSettings(false);
    setUploadError(null);
    setShowComposer(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề quảng cáo');
      return;
    }
    if (!formData.ctaLink.trim()) {
      toast.error('Vui lòng nhập đường dẫn CTA');
      return;
    }

    try {
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, data: formData });
        toast.success('Đã cập nhật quảng cáo');
      } else {
        await createAd.mutateAsync(formData);
        toast.success('Đã tạo quảng cáo mới');
      }
      setShowComposer(false);
      setFormData(initialFormData);
      setEditingAd(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus.mutateAsync(id);
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAd.mutateAsync(id);
      toast.success('Đã xóa quảng cáo');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const getPlacementLabel = (placement: AdPlacement) => {
    switch (placement) {
      case 'FEED': return 'Bảng tin';
      case 'SIDEBAR': return 'Thanh bên';
      case 'BOTH': return 'Cả hai';
      default: return placement;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Quảng cáo</h1>
          <p className="text-muted-foreground">Tạo và quản lý các quảng cáo hiển thị trên nền tảng</p>
        </div>
        {!showComposer && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo quảng cáo
          </Button>
        )}
      </div>

      {/* Compose-like Inline Form */}
      {showComposer && (
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-xl font-bold">
            {editingAd ? 'Chỉnh sửa quảng cáo' : 'Tạo bài viết quảng cáo mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Title input */}
              <div className="p-4 pb-0">
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tiêu đề quảng cáo (nội bộ)"
                  className="text-sm border-0 px-0 focus-visible:ring-0 font-medium"
                  maxLength={100}
                />
              </div>

              {/* Rich Text Editor */}
              <RichTextEditor
                content={formData.description || ''}
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="Bạn muốn quảng cáo điều gì? Viết nội dung hấp dẫn..."
                showToolbar={true}
                minHeight="min-h-[200px]"
                onPasteImage={handlePasteImage}
              />

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="p-3 border-t">
                  <div className="relative group rounded-lg overflow-hidden aspect-video max-h-64">
                    <img
                      src={transformImageUrl(formData.imageUrl) || formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 hover:text-white"
                      onClick={() => { setFormData({ ...formData, imageUrl: '' }); setUploadError(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-rose-600 mb-2" />
                        <span className="text-sm text-muted-foreground">Đang tải ảnh lên...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="px-4 py-3 border-t">
                <div className="bg-muted/50 rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="Nút CTA"
                      className="h-8 text-sm w-32"
                      maxLength={20}
                    />
                    <Input
                      type="url"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="https://link-đích-của-bạn.com"
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                  {formData.ctaText && formData.ctaLink && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Xem trước:</span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium">
                        {formData.ctaText}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Settings - Collapsible */}
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt nâng cao</span>
                  </div>
                  {showAdvancedSettings ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showAdvancedSettings && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Vị trí hiển thị
                        </label>
                        <select
                          value={formData.placement}
                          onChange={(e) => setFormData({ ...formData, placement: e.target.value as AdPlacement })}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="FEED">Bảng tin</option>
                          <option value="SIDEBAR">Thanh bên</option>
                          <option value="BOTH">Cả hai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Độ ưu tiên
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Kích hoạt quảng cáo</p>
                        <p className="text-xs text-muted-foreground">Quảng cáo sẽ hiển thị ngay khi được kích hoạt</p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                )}
              </div>


              {/* Compose-like Actions Bar */}
              <div className="p-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-green-600"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    title="Thêm ảnh (hoặc Ctrl+V để dán)"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </Button>
                  <span className={cn(
                    "text-xs ml-2",
                    isCharacterError ? "text-red-500 font-medium" :
                    isCharacterWarning ? "text-yellow-600" : "text-muted-foreground"
                  )}>
                    {characterCount}/500
                    {isCharacterError && " - Vượt quá!"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowComposer(false); setEditingAd(null); setFormData(initialFormData); }}>
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createAd.isPending || updateAd.isPending || isUploadingImage || isCharacterError}
                  >
                    {(createAd.isPending || updateAd.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đăng...
                      </>
                    ) : (
                      editingAd ? 'Cập nhật' : 'Đăng quảng cáo'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      )}

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách quảng cáo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có quảng cáo nào. Nhấn &ldquo;Tạo quảng cáo&rdquo; để bắt đầu.
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[60px]">Ảnh</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tiêu đề</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vị trí</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">CTA</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          Clicks
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ads.map((ad) => {
                      const stats = analytics?.[ad.id];
                      return (
                        <tr key={ad.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            {ad.imageUrl ? (
                              <img
                                src={transformImageUrl(ad.imageUrl) || ad.imageUrl}
                                alt={ad.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{ad.title}</div>
                            {ad.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {ad.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {getPlacementLabel(ad.placement)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={ad.ctaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              {ad.ctaText}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            {stats ? (
                              <div className="flex items-center justify-center gap-3 text-xs">
                                <div className="text-center" title="1 ngày">
                                  <div className="font-semibold text-foreground">{stats.clicks1d}</div>
                                  <div className="text-muted-foreground">1d</div>
                                </div>
                                <div className="text-center" title="7 ngày">
                                  <div className="font-semibold text-foreground">{stats.clicks7d}</div>
                                  <div className="text-muted-foreground">7d</div>
                                </div>
                                <div className="text-center" title="30 ngày">
                                  <div className="font-semibold text-foreground">{stats.clicks30d}</div>
                                  <div className="text-muted-foreground">30d</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-xs text-muted-foreground">—</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(ad.id)}
                              className={ad.isActive ? 'text-green-600' : 'text-gray-400'}
                            >
                              {ad.isActive ? (
                                <ToggleRight className="h-6 w-6" />
                              ) : (
                                <ToggleLeft className="h-6 w-6" />
                              )}
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(ad)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(ad.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa quảng cáo này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteAd.isPending}
            >
              {deleteAd.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

