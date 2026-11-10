'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useChatbotConfig,
  useUpdateChatbotConfig,
  useTestChatbotConnection,
  AI_PROVIDER_PROTOCOLS,
  type UpdateChatbotConfigDto,
  type TestConnectionResult,
} from '../api/chatbot-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  Save,
  Zap,
  Loader2,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

/** Suggestions only - the provider may support any other model id. */
const MODEL_SUGGESTIONS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-guard-4-12b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound',
];

const formSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url('BASE URL không hợp lệ'),
  protocol: z.enum(['OPENAI_CHAT_COMPLETION', 'OPENAI_RESPONSE']),
  primaryModel: z.string().min(1, 'Mô hình chính là bắt buộc'),
  fallbackModel: z.string().min(1, 'Mô hình dự phòng là bắt buộc'),
  maxTokens: z.number().min(128).max(2048),
  temperature: z.number().min(0).max(2),
});

type FormData = z.infer<typeof formSchema>;

export function ChatbotConfigPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const { data: config, isLoading, error } = useChatbotConfig();
  const updateConfig = useUpdateChatbotConfig();
  const testConnection = useTestChatbotConnection();

  const configValues = config ? {
    apiKey: '',
    baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    protocol: config.protocol || 'OPENAI_CHAT_COMPLETION',
    primaryModel: config.primaryModel,
    fallbackModel: config.fallbackModel,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  } : undefined;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: configValues,
    values: configValues,
  });

  const onSubmit = async (data: FormData) => {
    const payload: UpdateChatbotConfigDto = {
      baseUrl: data.baseUrl,
      protocol: data.protocol,
      primaryModel: data.primaryModel,
      fallbackModel: data.fallbackModel,
      maxTokens: data.maxTokens,
      temperature: data.temperature,
    };
    // Only include apiKey if user entered a new one
    if (data.apiKey && data.apiKey.trim()) {
      payload.apiKey = data.apiKey;
    }
    await updateConfig.mutateAsync(payload);
  };

  const handleTestConnection = async () => {
    const apiKey = form.getValues('apiKey');
    if (!apiKey && !config?.hasApiKey) {
      toast.error('Vui lòng nhập API Key để kiểm tra');
      return;
    }
    setTestResult(null);
    try {
      // Use entered key or fetch stored key for testing
      const keyToTest = apiKey || '';
      if (!keyToTest && config?.hasApiKey) {
        toast.error('Vui lòng nhập API Key mới để kiểm tra (API Key đã lưu không thể hiển thị)');
        return;
      }
      const result = await testConnection.mutateAsync({
        apiKey: keyToTest,
        model: form.getValues('primaryModel'),
        baseUrl: form.getValues('baseUrl'),
        protocol: form.getValues('protocol'),
      });
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Không thể kiểm tra kết nối');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-red-600">Không thể tải cấu hình chatbot</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Cấu hình Chatbot
        </h1>
        <p className="text-gray-500 mt-1">
          Quản lý cấu hình AI chatbot hỗ trợ khách hàng
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt AI Provider</CardTitle>
              <CardDescription>
                Cấu hình kết nối với nhà cung cấp AI (tương thích OpenAI) để xử lý chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={config?.hasApiKey ? '••••••••' + ' (đã lưu)' : 'gsk_... / sk-...'}
                    {...form.register('apiKey')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Khóa API để kết nối với nhà cung cấp AI. VD: lấy key tại console.groq.com
                </p>
                {config?.hasApiKey && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    API Key đã được cấu hình
                  </p>
                )}
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <Label htmlFor="baseUrl">BASE URL</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder={DEFAULT_BASE_URL}
                  {...form.register('baseUrl')}
                />
                <p className="text-xs text-gray-500">
                  Gốc của API tương thích OpenAI. VD: https://api.groq.com/openai/v1
                </p>
                {form.formState.errors.baseUrl && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.baseUrl.message}
                  </p>
                )}
              </div>

              {/* Protocol */}
              <div className="space-y-2">
                <Label htmlFor="protocol">PROTOCOL</Label>
                <Select
                  value={form.watch('protocol') || 'OPENAI_CHAT_COMPLETION'}
                  onValueChange={(value) =>
                    form.setValue('protocol', value as FormData['protocol'], { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="protocol">
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
                <p className="text-xs text-gray-500">
                  Định dạng request/response dùng để gọi provider.
                </p>
              </div>

              {/* Primary Model */}
              <div className="space-y-2">
                <Label htmlFor="primaryModel">Mô hình chính (MODEL ID)</Label>
                <Input
                  id="primaryModel"
                  list="chatbot-model-suggestions"
                  placeholder="llama-3.3-70b-versatile"
                  {...form.register('primaryModel')}
                />
                <datalist id="chatbot-model-suggestions">
                  {MODEL_SUGGESTIONS.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500">
                  Mô hình AI chính để xử lý chat. Nhập đúng tên model mà provider hỗ trợ.
                </p>
                {form.formState.errors.primaryModel && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.primaryModel.message}
                  </p>
                )}
              </div>

              {/* Fallback Model */}
              <div className="space-y-2">
                <Label htmlFor="fallbackModel">Mô hình dự phòng (MODEL ID)</Label>
                <Input
                  id="fallbackModel"
                  list="chatbot-model-suggestions"
                  placeholder="llama-3.1-8b-instant"
                  {...form.register('fallbackModel')}
                />
                <p className="text-xs text-gray-500">
                  Sử dụng khi mô hình chính gặp lỗi hoặc quá tải.
                </p>
                {form.formState.errors.fallbackModel && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.fallbackModel.message}
                  </p>
                )}
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Số token tối đa</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={128}
                  max={2048}
                  {...form.register('maxTokens', { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Giới hạn độ dài phản hồi (128-2048). Giá trị cao = câu trả lời dài hơn.
                </p>
                {form.formState.errors.maxTokens && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.maxTokens.message}
                  </p>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  {...form.register('temperature', { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Độ sáng tạo (0.0-2.0). Thấp = chính xác, Cao = sáng tạo.
                </p>
                {form.formState.errors.temperature && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.temperature.message}
                  </p>
                )}
              </div>

              {/* Test Result */}
              {testResult && (
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-green-50 text-green-700'
                        : testResult.details?.step === 'chat_test'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    ) : testResult.details?.step === 'chat_test' ? (
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span>{testResult.message}</span>
                      {testResult.details?.model && (
                        <p className="text-xs mt-1 opacity-75">
                          Model: {testResult.details.model}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Warning for partial success (key valid but chat blocked) */}
                  {!testResult.success && testResult.details?.step === 'chat_test' && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      <p className="font-medium flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        API key hợp lệ nhưng chat bị chặn
                      </p>
                      <p className="mt-1 text-xs">
                        Chatbot sẽ không hoạt động với cấu hình này. Kiểm tra tài khoản, BASE URL và PROTOCOL hoặc thử model khác.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Kiểm tra kết nối
                </Button>
                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
