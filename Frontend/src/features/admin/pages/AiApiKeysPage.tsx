'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
  useTestApiKey,
  AI_PROVIDER_PROTOCOLS,
  type AiProviderKey,
  type AiProviderProtocol,
  type UpdateApiKeyData,
} from '../api/ai-seeding.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronLeft,
  Plus,
  Key,
  Trash2,
  Edit2,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Bot,
  Globe,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL_ID = 'llama-3.1-8b-instant';

export function AiApiKeysPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<AiProviderKey | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [createProtocol, setCreateProtocol] = useState<AiProviderProtocol>('OPENAI_CHAT_COMPLETION');
  const [editProtocol, setEditProtocol] = useState<AiProviderProtocol>('OPENAI_CHAT_COMPLETION');

  const { data: apiKeys, isLoading, error } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const updateApiKey = useUpdateApiKey();
  const deleteApiKey = useDeleteApiKey();
  const testApiKey = useTestApiKey();

  const openEditDialog = (key: AiProviderKey) => {
    setEditProtocol(key.protocol || 'OPENAI_CHAT_COMPLETION');
    setEditingKey(key);
  };

  const handleCreate = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();
    const apiKey = (formData.get('apiKey') as string)?.trim();
    const baseUrl = (formData.get('baseUrl') as string)?.trim() || DEFAULT_BASE_URL;
    const modelId = (formData.get('modelId') as string)?.trim() || DEFAULT_MODEL_ID;
    const protocol = createProtocol || 'OPENAI_CHAT_COMPLETION';
    const maxAgents = parseInt(formData.get('maxAgents') as string) || 5;

    if (!name || !apiKey) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await createApiKey.mutateAsync({ name, apiKey, baseUrl, modelId, protocol, maxAgents });
      toast.success('Đã thêm API Key thành công');
      setShowAddDialog(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Không thể thêm API Key';
      toast.error(message);
    }
  };

  const handleUpdate = async (id: string, data: UpdateApiKeyData) => {
    try {
      await updateApiKey.mutateAsync({ id, data });
      toast.success('Đã cập nhật API Key');
      setEditingKey(null);
    } catch {
      toast.error('Không thể cập nhật API Key');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey.mutateAsync(id);
      toast.success('Đã xóa API Key');
      setDeleteConfirm(null);
    } catch {
      toast.error('Không thể xóa API Key');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testApiKey.mutateAsync(id);
      if (result.valid) {
        toast.success('API Key hợp lệ');
      } else {
        toast.error('API Key không hợp lệ');
      }
    } catch {
      toast.error('Không thể kiểm tra API Key');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-red-600">Không thể tải danh sách API Keys</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/ai-seeding">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý API Keys</h1>
            <p className="text-gray-500 mt-1">
              Quản lý API key của nhà cung cấp AI cho AI agents
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm API Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : apiKeys && apiKeys.length > 0 ? (
          apiKeys.map((key) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              onEdit={() => openEditDialog(key)}
              onDelete={() => setDeleteConfirm(key.id)}
              onTest={() => handleTest(key.id)}
              onToggleActive={(isActive) => handleUpdate(key.id, { isActive })}
              isUpdating={updateApiKey.isPending}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có API Key nào</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Thêm API Key đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm API Key mới</DialogTitle>
            <DialogDescription>
              Cấu hình nhà cung cấp AI (OpenAI-compatible) cho các AI agents
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tên</label>
              <Input name="name" placeholder="VD: Groq Key 1" className="mt-1" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <Input name="apiKey" type="password" placeholder="gsk_... / sk-..." className="mt-1" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">BASE URL</label>
              <Input
                name="baseUrl"
                type="url"
                defaultValue={DEFAULT_BASE_URL}
                placeholder={DEFAULT_BASE_URL}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Gốc của API tương thích OpenAI. VD: https://api.groq.com/openai/v1
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">MODEL ID</label>
              <Input
                name="modelId"
                defaultValue={DEFAULT_MODEL_ID}
                placeholder={DEFAULT_MODEL_ID}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tên model mà nhà cung cấp này hiểu. VD: llama-3.1-8b-instant
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PROTOCOL</label>
              <Select
                value={createProtocol}
                onValueChange={(value) => setCreateProtocol(value as AiProviderProtocol)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn protocol" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDER_PROTOCOLS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label} ({p.endpoint})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Số agents tối đa</label>
              <Input name="maxAgents" type="number" defaultValue={5} min={1} className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createApiKey.isPending}>
                {createApiKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Thêm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingKey} onOpenChange={() => setEditingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa API Key</DialogTitle>
            <DialogDescription>
              Để trống API Key nếu bạn không muốn thay đổi khóa hiện tại
            </DialogDescription>
          </DialogHeader>
          {editingKey && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const apiKey = (formData.get('apiKey') as string)?.trim();
                const data: UpdateApiKeyData = {
                  name: formData.get('name') as string,
                  baseUrl: (formData.get('baseUrl') as string)?.trim(),
                  modelId: (formData.get('modelId') as string)?.trim(),
                  protocol: editProtocol,
                  maxAgents: parseInt(formData.get('maxAgents') as string),
                };
                if (apiKey) data.apiKey = apiKey;
                handleUpdate(editingKey.id, data);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-gray-700">Tên</label>
                <Input name="name" defaultValue={editingKey.name} className="mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">API Key</label>
                <Input
                  name="apiKey"
                  type="password"
                  placeholder={editingKey.maskedKey || 'Nhập key mới (tuỳ chọn)'}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">BASE URL</label>
                <Input name="baseUrl" type="url" defaultValue={editingKey.baseUrl} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">MODEL ID</label>
                <Input name="modelId" defaultValue={editingKey.modelId} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">PROTOCOL</label>
                <Select
                  value={editProtocol}
                  onValueChange={(value) => setEditProtocol(value as AiProviderProtocol)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDER_PROTOCOLS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} ({p.endpoint})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Số agents tối đa</label>
                <Input name="maxAgents" type="number" defaultValue={editingKey.maxAgents} min={1} className="mt-1" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingKey(null)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={updateApiKey.isPending}>
                  {updateApiKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Lưu
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa API Key này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteApiKey.isPending}
            >
              {deleteApiKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// API Key Card Component
interface ApiKeyCardProps {
  apiKey: AiProviderKey;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggleActive: (isActive: boolean) => void;
  isUpdating: boolean;
}

function ApiKeyCard({ apiKey, onEdit, onDelete, onTest, onToggleActive, isUpdating }: ApiKeyCardProps) {
  const protocolLabel =
    AI_PROVIDER_PROTOCOLS.find((p) => p.value === apiKey.protocol)?.label ??
    apiKey.protocol;

  return (
    <Card className={cn(!apiKey.isActive && 'opacity-60')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', apiKey.isActive ? 'bg-green-50' : 'bg-gray-100')}>
            <Key className={cn('h-5 w-5', apiKey.isActive ? 'text-green-600' : 'text-gray-400')} />
          </div>
          <div>
            <CardTitle className="text-base">{apiKey.name}</CardTitle>
            <p className="text-xs text-gray-500">
              Tạo: {new Date(apiKey.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={apiKey.isActive}
            onCheckedChange={onToggleActive}
            disabled={isUpdating}
          />
          <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
            {apiKey.isActive ? 'Hoạt động' : 'Tắt'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Agents</p>
            <p className="font-semibold flex items-center gap-1">
              <Bot className="h-4 w-4 text-gray-400" />
              {apiKey.agentCount}/{apiKey.maxAgents}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sử dụng hôm nay</p>
            <p className="font-semibold">{apiKey.usageToday.toLocaleString('vi-VN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng sử dụng</p>
            <p className="font-semibold">{apiKey.usageTotal.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Provider configuration */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 mb-4 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 shrink-0 w-20">BASE URL</span>
            <span className="font-mono text-xs truncate">{apiKey.baseUrl}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Cpu className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 shrink-0 w-20">MODEL ID</span>
            <span className="font-mono text-xs truncate">{apiKey.modelId}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="h-4 w-4 shrink-0" />
            <span className="text-xs text-gray-500 shrink-0 w-20">PROTOCOL</span>
            <span className="text-xs truncate">{protocolLabel}</span>
          </div>
          {apiKey.maskedKey && (
            <div className="flex items-center gap-2 text-gray-700">
              <Key className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 shrink-0 w-20">API KEY</span>
              <span className="font-mono text-xs truncate">{apiKey.maskedKey}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onTest}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Kiểm tra
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-1" />
            Sửa
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
