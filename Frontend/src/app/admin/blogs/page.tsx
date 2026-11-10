'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAdminBlogPosts,
  useAdminBlogCategories,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
} from '@/features/blog/api/blog-admin'
import type { BlogPost, BlogPostStatus, BlogPostType } from '@/types/blog'

const blogPostSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  excerpt: z.string().max(500, 'Tóm tắt tối đa 500 ký tự').optional().or(z.literal('')),
  featuredImage: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Danh mục là bắt buộc'),
  postType: z.enum(['ARTICLE', 'TUTORIAL', 'COMPARISON', 'FAQ']).default('ARTICLE'),
  tags: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metaTitle: z.string().max(70, 'Meta title tối đa 70 ký tự').optional().or(z.literal('')),
  metaDescription: z.string().max(160, 'Meta description tối đa 160 ký tự').optional().or(z.literal('')),
})

type BlogPostFormData = z.infer<typeof blogPostSchema>

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const POST_TYPE_OPTIONS: { value: BlogPostType; label: string }[] = [
  { value: 'ARTICLE', label: 'Bài viết' },
  { value: 'TUTORIAL', label: 'Hướng dẫn' },
  { value: 'COMPARISON', label: 'So sánh' },
  { value: 'FAQ', label: 'FAQ' },
]

function getStatusBadgeVariant(status: BlogPostStatus) {
  switch (status) {
    case 'PUBLISHED': return 'default'
    case 'DRAFT': return 'secondary'
    case 'ARCHIVED': return 'outline'
    default: return 'secondary'
  }
}

function getPostTypeBadgeClass(type: BlogPostType) {
  switch (type) {
    case 'ARTICLE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'TUTORIAL': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'COMPARISON': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'FAQ': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function AdminBlogsPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const { data: postsData, isLoading } = useAdminBlogPosts(
    page,
    10,
    statusFilter === 'ALL' ? undefined : statusFilter
  )
  const { data: categories } = useAdminBlogCategories()
  const createPost = useCreateBlogPost()
  const updatePost = useUpdateBlogPost()
  const deletePost = useDeleteBlogPost()

  const posts = postsData?.data || []
  const meta = postsData?.meta

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof blogPostSchema>, unknown, z.output<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      featuredImage: '',
      categoryId: '',
      postType: 'ARTICLE',
      tags: '',
      status: 'DRAFT',
      metaTitle: '',
      metaDescription: '',
    },
  })

  const openCreateDialog = () => {
    setEditingPost(null)
    reset({
      title: '',
      content: '',
      excerpt: '',
      featuredImage: '',
      categoryId: categories?.[0]?.id || '',
      postType: 'ARTICLE',
      tags: '',
      status: 'DRAFT',
      metaTitle: '',
      metaDescription: '',
    })
    setShowDialog(true)
  }

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post)
    reset({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      featuredImage: post.featuredImage || '',
      categoryId: post.categoryId,
      postType: post.postType,
      tags: post.tags?.join(', ') || '',
      status: post.status,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
    })
    setShowDialog(true)
  }

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        excerpt: data.excerpt || undefined,
        featuredImage: data.featuredImage || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      }

      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, data: payload })
        toast.success('Đã cập nhật bài viết')
      } else {
        await createPost.mutateAsync(payload)
        toast.success('Đã tạo bài viết mới')
      }
      setShowDialog(false)
      reset()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deletePost.mutateAsync(deleteId)
      toast.success('Đã xóa bài viết')
      setDeleteId(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Blog</h1>
          <p className="text-gray-500">Quản lý các bài viết trên blog</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm bài viết
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as BlogPostStatus | 'ALL'); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="ALL">Tất cả</TabsTrigger>
          <TabsTrigger value="DRAFT">Nháp</TabsTrigger>
          <TabsTrigger value="PUBLISHED">Đã xuất bản</TabsTrigger>
          <TabsTrigger value="ARCHIVED">Lưu trữ</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lượt xem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất bản</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-3">
                    <div className="font-medium truncate max-w-xs">{post.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{post.category?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {STATUS_OPTIONS.find(s => s.value === post.status)?.label || post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeBadgeClass(post.postType)}`}>
                      {POST_TYPE_OPTIONS.find(t => t.value === post.postType)?.label || post.postType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-4 h-4" />
                      {post.viewCount || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(post.publishedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(post.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Chưa có bài viết nào. Nhấn &quot;Thêm bài viết&quot; để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage(p => p - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-500">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => setPage(p => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input id="title" {...register('title')} placeholder="Nhập tiêu đề bài viết" />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Danh mục *</Label>
                <Select value={watch('categoryId')} onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postType">Loại bài viết</Label>
                <Select value={watch('postType')} onValueChange={(v) => setValue('postType', v as BlogPostType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as BlogPostStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featuredImage">Ảnh đại diện (URL)</Label>
                <Input id="featuredImage" {...register('featuredImage')} placeholder="https://..." />
                {errors.featuredImage && <p className="text-sm text-red-500">{errors.featuredImage.message}</p>}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="excerpt">Tóm tắt</Label>
                <Textarea id="excerpt" {...register('excerpt')} placeholder="Mô tả ngắn về bài viết..." rows={2} />
                {errors.excerpt && <p className="text-sm text-red-500">{errors.excerpt.message}</p>}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="content">Nội dung *</Label>
                <Textarea id="content" {...register('content')} placeholder="Nội dung bài viết..." rows={8} />
                {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
                <Input id="tags" {...register('tags')} placeholder="nextjs, react, typescript" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input id="metaTitle" {...register('metaTitle')} placeholder="Tối đa 70 ký tự" />
                {errors.metaTitle && <p className="text-sm text-red-500">{errors.metaTitle.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Input id="metaDescription" {...register('metaDescription')} placeholder="Tối đa 160 ký tự" />
                {errors.metaDescription && <p className="text-sm text-red-500">{errors.metaDescription.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                {(createPost.isPending || updatePost.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingPost ? 'Cập nhật' : 'Tạo mới'}
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
            Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePost.isPending}>
              {deletePost.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

