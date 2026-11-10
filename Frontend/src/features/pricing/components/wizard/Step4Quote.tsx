'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSubmitQuote } from '../../api/pricing';
import { useWizardStore, calculateTotal } from '../../stores/wizard-store';
import { formatVNDPrice } from '../../utils';

const quoteSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  company: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  requirements: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const BUDGET_OPTIONS = [
  { value: 'under-10m', label: 'Dưới 10 triệu' },
  { value: '10-30m', label: '10 - 30 triệu' },
  { value: '30-50m', label: '30 - 50 triệu' },
  { value: '50-100m', label: '50 - 100 triệu' },
  { value: 'over-100m', label: 'Trên 100 triệu' },
  { value: 'unknown', label: 'Chưa xác định' },
];

const TIMELINE_OPTIONS = [
  { value: 'under-1m', label: 'Dưới 1 tháng' },
  { value: '1-2m', label: '1 - 2 tháng' },
  { value: '2-3m', label: '2 - 3 tháng' },
  { value: '3-6m', label: '3 - 6 tháng' },
  { value: 'over-6m', label: 'Trên 6 tháng' },
  { value: 'unknown', label: 'Chưa xác định' },
];

export function Step4Quote() {
  const submitQuote = useSubmitQuote();
  const { selectedItems, reset: resetWizard, isQuoteSubmitted, setQuoteSubmitted, setSubmitting } = useWizardStore();
  const total = calculateTotal(selectedItems);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      budget: '',
      timeline: '',
      requirements: '',
    },
  });

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitting(true);
    try {
      // Get first selected item for serviceId/tierId
      const firstItem = selectedItems[0];
      await submitQuote.mutateAsync({
        ...data,
        serviceId: firstItem?.serviceId,
        tierId: firstItem?.tierId,
        source: 'pricing-wizard',
        requirements: data.requirements
          ? `${data.requirements}\n\nDịch vụ đã chọn:\n${selectedItems.map((i) => `- ${i.serviceName}: ${i.tierName} (${formatVNDPrice(i.price)})`).join('\n')}`
          : `Dịch vụ đã chọn:\n${selectedItems.map((i) => `- ${i.serviceName}: ${i.tierName} (${formatVNDPrice(i.price)})`).join('\n')}`,
      });
      setQuoteSubmitted(true);
      toast.success('Yêu cầu báo giá đã được gửi thành công!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isQuoteSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16 px-4"
      >
        <Card className="max-w-lg mx-auto p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-2xl font-bold text-sky-950 mb-3">Cảm ơn bạn!</h2>
          <p className="text-slate-500 mb-6">
            Chúng tôi đã nhận được yêu cầu báo giá của bạn và sẽ liên hệ trong vòng 24 giờ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setQuoteSubmitted(false);
                resetWizard();
              }}
              variant="outline"
              className="border-sky-200 text-sky-700"
            >
              Gửi yêu cầu khác
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-sky-950 mb-3">
            Nhận báo giá chi tiết
          </h2>
          <p className="text-lg text-slate-500">
            Điền thông tin để nhận báo giá chi tiết qua email
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form id="quote-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold text-sky-950 mb-4">Thông tin liên hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        placeholder="Nguyễn Văn A"
                        {...register('name')}
                        className={cn(errors.name && 'border-rose-500')}
                      />
                      {errors.name && (
                        <p className="text-sm text-rose-500">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        {...register('email')}
                        className={cn(errors.email && 'border-rose-500')}
                      />
                      {errors.email && (
                        <p className="text-sm text-rose-500">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" placeholder="0912 345 678" {...register('phone')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Công ty</Label>
                      <Input id="company" placeholder="Tên công ty (nếu có)" {...register('company')} />
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h3 className="text-lg font-semibold text-sky-950 mb-4">Chi tiết dự án</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Ngân sách dự kiến</Label>
                      <Select onValueChange={(value) => setValue('budget', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ngân sách" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Thời gian mong muốn</Label>
                      <Select onValueChange={(value) => setValue('timeline', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMELINE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="requirements">Mô tả yêu cầu</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Mô tả ngắn gọn về dự án hoặc yêu cầu của bạn..."
                      rows={4}
                      {...register('requirements')}
                    />
                  </div>
                </div>
              </form>
            </Card>
          </div>

          {/* Summary Sidebar - Desktop */}
          <div className="hidden lg:block">
            <Card className="p-6 sticky top-24 bg-sky-50 border-sky-200">
              <h3 className="text-lg font-semibold text-sky-950 mb-4">Tóm tắt báo giá</h3>

              {selectedItems.length > 0 ? (
                <>
                  <ul className="space-y-3 mb-4">
                    {selectedItems.map((item) => (
                      <li key={item.tierId} className="p-3 bg-white rounded-lg">
                        <p className="font-medium text-sky-950 text-sm">{item.serviceName}</p>
                        <p className="text-xs text-slate-500">{item.tierName}</p>
                        <p className="text-sm font-semibold text-sky-600 mt-1">
                          {formatVNDPrice(item.price)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-sky-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-500">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-sky-950">
                        {formatVNDPrice(total)}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      form="quote-form"
                      disabled={submitQuote.isPending}
                      className="w-full min-h-[48px] bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {submitQuote.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Gửi yêu cầu báo giá
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">Chưa có dịch vụ nào được chọn</p>
              )}

              {/* Trust signals */}
              <div className="mt-6 pt-4 border-t border-sky-200">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Phản hồi trong 24 giờ</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

