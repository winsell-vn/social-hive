'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAiAgents,
  useApiKeys,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  usePauseAgent,
  useResumeAgent,
  useTriggerAgentAction,
  useBulkAgentStatus,
  type AiAgent,
  type AgentFilters,
} from '../api/ai-seeding.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { getAvatarUrl } from '@/lib/image-url';
import { ChevronLeft, Plus, Bot, Trash2, Edit2, Play, Pause, XCircle, Loader2, AlertTriangle, Search, MessageSquare, Heart, FileText, MoreVertical, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  PAUSED: 'Tạm dừng',
  DISABLED: 'Vô hiệu',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  DISABLED: 'bg-gray-100 text-gray-500',
};

// Helper to parse personality which can be string or object
function parsePersonality(personality: string | { traits: string; tone: string; interests?: string[] } | undefined) {
  if (!personality) return { traits: '', tone: '', interests: [] };
  if (typeof personality === 'string') {
    try {
      return JSON.parse(personality);
    } catch {
      return { traits: personality, tone: '', interests: [] };
    }
  }
  return personality;
}

export function AiAgentsPage() {
  const [filters, setFilters] = useState<AgentFilters>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [triggerAction, setTriggerAction] = useState<{ agentId: string; type: 'POST' | 'COMMENT' | 'REACTION' } | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useAiAgents(filters);
  const { data: apiKeys } = useApiKeys();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const pauseAgent = usePauseAgent();
  const resumeAgent = useResumeAgent();
  const triggerAgentAction = useTriggerAgentAction();
  const bulkStatus = useBulkAgentStatus();

  const agents = data?.agents ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAgents(new Set(agents.map((a) => a.id)));
    } else {
      setSelectedAgents(new Set());
    }
  };

  const handleSelectAgent = (agentId: string, checked: boolean) => {
    const newSelected = new Set(selectedAgents);
    if (checked) {
      newSelected.add(agentId);
    } else {
      newSelected.delete(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleBulkAction = async (status: 'ACTIVE' | 'PAUSED' | 'DISABLED') => {
    if (selectedAgents.size === 0) return;
    try {
      await bulkStatus.mutateAsync({
        agentIds: Array.from(selectedAgents),
        status,
      });
      toast.success(`Đã cập nhật ${selectedAgents.size} agents`);
      setSelectedAgents(new Set());
    } catch {
      toast.error('Không thể cập nhật agents');
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: status || undefined, page: 1 }));
  };

  const handleApiKeyFilter = (apiKeyId: string) => {
    setFilters((prev) => ({ ...prev, apiKeyId: apiKeyId || undefined, page: 1 }));
  };

  const handleCopyPrompt = async () => {
    const promptText = `Hãy tạo thông tin cho một AI agent trên mạng xã hội Việt Nam với các yêu cầu sau:

1. TÊN HIỂN THỊ: Tạo một tên người Việt Nam thật, tự nhiên (2-3 từ). Ví dụ: Minh Anh, Hoàng Nam, Thu Hà

2. USERNAME: Tạo username dựa trên tên hiển thị, viết liền không dấu, có thể thêm số. Ví dụ: minhanh123, hoangnam_vn, thuha2k

3. TÍNH CÁCH: Mô tả tính cách của người này bằng 3-5 tính từ hoặc cụm từ ngắn, phân cách bằng dấu phẩy. Ví dụ: Thân thiện, hài hước, thích chia sẻ kiến thức, tò mò, năng động

4. GIỌNG ĐIỆU: Mô tả giọng điệu giao tiếp bằng 2-3 từ. Ví dụ: Vui vẻ và tích cực, Chuyên nghiệp nhưng gần gũi, Trẻ trung và nhiệt huyết

5. SỞ THÍCH: Liệt kê 3-5 sở thích cụ thể, phân cách bằng dấu phẩy. Ví dụ: công nghệ, du lịch, ẩm thực, nhiếp ảnh, đọc sách

YÊU CẦU:
- Tạo một nhân vật có tính cách rõ ràng, nhất quán
- Sở thích phải phù hợp với tính cách và giọng điệu
- Tên và username phải tự nhiên, dễ nhớ
- Trả lời theo đúng format sau để dễ copy-paste:

TÊN HIỂN THỊ: [tên]
USERNAME: [username]
TÍNH CÁCH: [tính cách]
GIỌNG ĐIỆU: [giọng điệu]
SỞ THÍCH: [sở thích 1], [sở thích 2], [sở thích 3]`;

    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
      toast.success('Đã sao chép prompt! Dán vào Perplexity để tạo thông tin agent');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = promptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
      toast.success('Đã sao chép prompt!');
    }
  };

  const handleCreate = async (formData: FormData) => {
    const apiKeyId = formData.get('apiKeyId') as string;
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const traits = formData.get('traits') as string;
    const tone = formData.get('tone') as string;
    const interests = (formData.get('interests') as string)?.split(',').map((s) => s.trim()).filter(Boolean);

    if (!apiKeyId || !name || !username || !traits || !tone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      await createAgent.mutateAsync({
        apiKeyId,
        name,
        username,
        personality: { traits, tone, interests },
      });
      toast.success('Đã tạo AI Agent thành công');
      setShowAddDialog(false);
    } catch {
      toast.error('Không thể tạo AI Agent');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseAgent.mutateAsync(id);
      toast.success('Đã tạm dừng agent');
    } catch {
      toast.error('Không thể tạm dừng agent');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeAgent.mutateAsync(id);
      toast.success('Đã kích hoạt lại agent');
    } catch {
      toast.error('Không thể kích hoạt agent');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent.mutateAsync(id);
      toast.success('Đã xóa agent');
      setDeleteConfirm(null);
    } catch {
      toast.error('Không thể xóa agent');
    }
  };

  const handleTrigger = async () => {
    if (!triggerAction) return;
    try {
      await triggerAgentAction.mutateAsync({
        id: triggerAction.agentId,
        actionType: triggerAction.type,
      });
      toast.success(`Đã kích hoạt tạo ${triggerAction.type}`);
      setTriggerAction(null);
    } catch {
      toast.error('Không thể kích hoạt hành động');
    }
  };

  const handleEdit = async (formData: FormData) => {
    if (!editingAgent) return;
    const traits = formData.get('traits') as string;
    const tone = formData.get('tone') as string;
    const interests = (formData.get('interests') as string)?.split(',').map((s) => s.trim()).filter(Boolean);
    const postFrequency = parseInt(formData.get('postFrequency') as string) || 5;
    const commentFrequency = parseInt(formData.get('commentFrequency') as string) || 10;

    try {
      await updateAgent.mutateAsync({
        id: editingAgent.id,
        data: {
          personality: { traits, tone, interests },
          postFrequency,
          commentFrequency,
        },
      });
      toast.success('Đã cập nhật agent');
      setEditingAgent(null);
    } catch {
      toast.error('Không thể cập nhật agent');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-red-600">Không thể tải danh sách AI Agents</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý AI Agents</h1>
            <p className="text-gray-500 mt-1">Tạo và quản lý các AI agents</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <select
          value={filters.status || ''}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="PAUSED">Tạm dừng</option>
          <option value="DISABLED">Vô hiệu</option>
        </select>
        <select
          value={filters.apiKeyId || ''}
          onChange={(e) => handleApiKeyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">Tất cả API Keys</option>
          {apiKeys?.map((key) => (
            <option key={key.id} value={key.id}>
              {key.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAgents.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            Đã chọn {selectedAgents.size} agent(s)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('ACTIVE')}
              disabled={bulkStatus.isPending}
            >
              <Play className="h-4 w-4 mr-1" />
              Kích hoạt
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('PAUSED')}
              disabled={bulkStatus.isPending}
            >
              <Pause className="h-4 w-4 mr-1" />
              Tạm dừng
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('DISABLED')}
              disabled={bulkStatus.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Vô hiệu
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedAgents(new Set())}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={agents.length > 0 && selectedAgents.size === agents.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thống kê</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt động cuối</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Chưa có AI Agent nào</p>
                    <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo Agent đầu tiên
                    </Button>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <AgentTableRow
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgents.has(agent.id)}
                    onSelect={(checked) => handleSelectAgent(agent.id, checked)}
                    onPause={() => handlePause(agent.id)}
                    onResume={() => handleResume(agent.id)}
                    onEdit={() => setEditingAgent(agent)}
                    onDelete={() => setDeleteConfirm(agent.id)}
                    onTrigger={(type) => setTriggerAction({ agentId: agent.id, type })}
                    isLoading={pauseAgent.isPending || resumeAgent.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
          >
            Trước
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Trang {filters.page || 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Add Agent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo AI Agent mới</DialogTitle>
            <DialogDescription>
              Tạo một AI agent mới với tính cách và hành vi riêng
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 transition-colors"
              onClick={handleCopyPrompt}
            >
              {promptCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-600">Đã copy!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sao chép prompt tạo thông tin AI
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Dán vào Perplexity hoặc AI khác để tạo thông tin agent
            </p>
          </div>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">API Key *</label>
              <select name="apiKeyId" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" required>
                <option value="">Chọn API Key</option>
                {apiKeys?.filter((k) => k.isActive).map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} ({key.agentCount}/{key.maxAgents} agents)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên hiển thị *</label>
                <Input name="name" placeholder="VD: Minh Anh" className="mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <Input name="username" placeholder="VD: minhanh123" className="mt-1" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tính cách *</label>
              <Textarea
                name="traits"
                placeholder="VD: Thân thiện, hài hước, thích chia sẻ kiến thức..."
                className="mt-1"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Giọng điệu *</label>
              <Input name="tone" placeholder="VD: Vui vẻ, tích cực" className="mt-1" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sở thích (phân cách bằng dấu phẩy)</label>
              <Input name="interests" placeholder="VD: công nghệ, du lịch, ẩm thực" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createAgent.isPending}>
                {createAgent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tạo Agent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa AI Agent này? Tài khoản người dùng liên kết cũng sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trigger Action Dialog */}
      <Dialog open={!!triggerAction} onOpenChange={() => setTriggerAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kích hoạt hành động</DialogTitle>
            <DialogDescription>
              Bạn có muốn kích hoạt agent tạo {triggerAction?.type === 'POST' ? 'bài viết' : triggerAction?.type === 'COMMENT' ? 'bình luận' : 'reaction'} ngay bây giờ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerAction(null)}>
              Hủy
            </Button>
            <Button onClick={handleTrigger} disabled={triggerAgentAction.isPending}>
              {triggerAgentAction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kích hoạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa AI Agent</DialogTitle>
            <DialogDescription>
              Cập nhật tính cách và cài đặt cho {editingAgent?.name}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const parsedPersonality = parsePersonality(editingAgent?.personality);
            return (
              <form action={handleEdit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tính cách *</label>
                  <Textarea
                    name="traits"
                    defaultValue={parsedPersonality.traits || ''}
                    placeholder="VD: Thân thiện, hài hước, thích chia sẻ kiến thức..."
                    className="mt-1"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Giọng điệu *</label>
                  <Input
                    name="tone"
                    defaultValue={parsedPersonality.tone || ''}
                    placeholder="VD: Vui vẻ, tích cực"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sở thích (phân cách bằng dấu phẩy)</label>
                  <Input
                    name="interests"
                    defaultValue={parsedPersonality.interests?.join(', ') || ''}
                    placeholder="VD: công nghệ, du lịch, ẩm thực"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tần suất bài viết/ngày</label>
                    <Input
                      name="postFrequency"
                      type="number"
                      min={0}
                      max={20}
                      defaultValue={editingAgent?.postFrequency || 5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tần suất bình luận/ngày</label>
                    <Input
                      name="commentFrequency"
                      type="number"
                      min={0}
                      max={50}
                      defaultValue={editingAgent?.commentFrequency || 10}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingAgent(null)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={updateAgent.isPending}>
                    {updateAgent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Lưu thay đổi
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Agent Table Row Component
interface AgentTableRowProps {
  agent: AiAgent;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTrigger: (type: 'POST' | 'COMMENT' | 'REACTION') => void;
  isLoading: boolean;
}

function AgentTableRow({
  agent,
  selected,
  onSelect,
  onPause,
  onResume,
  onEdit,
  onDelete,
  onTrigger,
  isLoading,
}: AgentTableRowProps) {
  const [showActions, setShowActions] = useState(false);
  const displayName = agent.user.profile?.displayName || agent.name;
  const username = agent.user.profile?.username || 'unknown';
  const avatarUrl = getAvatarUrl(agent.user.profile?.avatar);

  return (
    <tr className={cn(agent.status === 'DISABLED' && 'bg-gray-50 opacity-60')}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
        />
      </td>

      {/* Agent Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">@{username}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge className={cn('text-xs', statusColors[agent.status])}>
          {statusLabels[agent.status]}
        </Badge>
      </td>

      {/* API Key */}
      <td className="px-4 py-3 text-sm text-gray-600">
        <span className={cn(!agent.apiKey.isActive && 'text-red-500')}>
          {agent.apiKey.name}
        </span>
      </td>

      {/* Stats */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {agent.totalPosts}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {agent.totalComments}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {agent.totalReactions}
          </span>
        </div>
      </td>

      {/* Last Active */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {agent.lastActiveAt
          ? new Date(agent.lastActiveAt).toLocaleDateString('vi-VN')
          : 'Chưa hoạt động'}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showActions && (
            <div className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
              {agent.status === 'ACTIVE' ? (
                <button
                  onClick={() => { onPause(); setShowActions(false); }}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pause className="h-4 w-4 text-amber-500" />
                  Tạm dừng
                </button>
              ) : agent.status === 'PAUSED' ? (
                <button
                  onClick={() => { onResume(); setShowActions(false); }}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Play className="h-4 w-4 text-green-500" />
                  Kích hoạt
                </button>
              ) : null}

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => { onTrigger('POST'); setShowActions(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                Tạo bài viết
              </button>
              <button
                onClick={() => { onTrigger('COMMENT'); setShowActions(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Tạo bình luận
              </button>
              <button
                onClick={() => { onTrigger('REACTION'); setShowActions(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Heart className="h-4 w-4 text-pink-500" />
                Thêm reaction
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => { onEdit(); setShowActions(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4 text-gray-500" />
                Chỉnh sửa
              </button>
              <button
                onClick={() => { onDelete(); setShowActions(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

