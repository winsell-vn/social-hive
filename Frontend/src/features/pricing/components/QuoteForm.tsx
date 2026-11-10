'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import {
  Loader2,
  Send,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubmitQuote, usePublicPricing } from '../api/pricing';
import { formatVNDPrice } from '../utils';
import { ICON_MAP, DEFAULT_ICON } from '../constants';
import type { Service, PricingTier } from '@/types/pricing';

const quoteSchema = z.object({
  serviceId: z.string().optional(),
  tierId: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  requirements: z.string().optional(),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  services?: Array<Service & { pricingTiers: PricingTier[] }>;
}

const BUDGET_OPTIONS = [
  'Dưới 10 triệu',
  '10 - 30 triệu',
  '30 - 50 triệu',
  '50 - 100 triệu',
  'Trên 100 triệu',
  'Chưa xác định',
];

const TIMELINE_OPTIONS = [
  'Dưới 1 tháng',
  '1 - 2 tháng',
  '2 - 3 tháng',
  '3 - 6 tháng',
  'Trên 6 tháng',
  'Chưa xác định',
];

export function QuoteForm({ services: propServices }: QuoteFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitQuote = useSubmitQuote();
  const { data: pricingData } = usePublicPricing();

  const services = propServices || pricingData?.services || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      serviceId: '',
      tierId: '',
      budget: '',
      timeline: '',
      requirements: '',
      name: '',
      email: '',
      phone: '',
      company: '',
    },
  });

  const selectedServiceId = watch('serviceId');
  const selectedTierId = watch('tierId');
  const selectedBudget = watch('budget');
  const selectedTimeline = watch('timeline');

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedTier = selectedService?.pricingTiers?.find(
    (t) => t.id === selectedTierId
  );

  const onSubmit = async (data: QuoteFormData) => {
    try {
      await submitQuote.mutateAsync({
        ...data,
        source: 'pricing-page',
      });
      setIsSubmitted(true);
      reset();
      toast.success('Yêu cầu báo giá đã được gửi thành công!');
    } catch (error: unknown) {
      let message = 'Có lỗi xảy ra. Vui lòng thử lại.';
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    }
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      const isValid = await trigger(['name', 'email']);
      if (isValid) {
        handleSubmit(onSubmit)();
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderProgressIndicator = () => {
    const steps = ['Dịch vụ', 'Gói dịch vụ', 'Chi tiết', 'Liên hệ'];
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                index < currentStep
                  ? 'bg-emerald-500 text-white'
                  : index === currentStep
                    ? 'bg-white text-gray-900 ring-2 ring-rose-500 ring-offset-2 ring-offset-gray-900'
                    : 'bg-gray-700 text-gray-400'
              )}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 md:w-20 h-1 mx-1',
                  index < currentStep ? 'bg-emerald-500' : 'bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep0 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center mb-6">
        Chọn dịch vụ bạn quan tâm
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const IconComponent = ICON_MAP[service.icon || 'globe'] || DEFAULT_ICON;
          const isSelected = selectedServiceId === service.id;
          return (
            <Card
              key={service.id}
              className={cn(
                'p-6 cursor-pointer transition-all border-2',
                isSelected
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                  : 'border-transparent hover:border-gray-300'
              )}
              onClick={() => {
                setValue('serviceId', service.id);
                setValue('tierId', '');
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    isSelected ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{service.name}</h4>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center mb-2">
        Chọn gói dịch vụ
      </h3>
      {selectedTier && (
        <div className="text-center mb-4">
          <Badge className="bg-rose-500 text-white text-lg px-4 py-1">
            {formatVNDPrice(selectedTier.price)}
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedService?.pricingTiers?.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          return (
            <Card
              key={tier.id}
              className={cn(
                'p-6 cursor-pointer transition-all border-2 relative',
                isSelected
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                  : 'border-transparent hover:border-gray-300'
              )}
              onClick={() => setValue('tierId', tier.id)}
            >
              {tier.isPopular && (
                <Badge className="absolute -top-2 right-4 bg-rose-500">
                  Phổ biến
                </Badge>
              )}
              <h4 className="font-semibold text-lg mb-2">{tier.name}</h4>
              <p className="text-2xl font-bold text-rose-500 mb-2">
                {formatVNDPrice(tier.price)}
              </p>
              {tier.priceNote && (
                <p className="text-sm text-gray-500 mb-3">{tier.priceNote}</p>
              )}
              {tier.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tier.description}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center mb-6">
        Chi tiết dự án
      </h3>
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Ngân sách dự kiến</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BUDGET_OPTIONS.map((option) => (
              <Card
                key={option}
                className={cn(
                  'p-3 cursor-pointer text-center transition-all border-2',
                  selectedBudget === option
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-transparent hover:border-gray-300'
                )}
                onClick={() => setValue('budget', option)}
              >
                <span className="text-sm">{option}</span>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-base font-medium mb-3 block">Thời gian mong muốn</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TIMELINE_OPTIONS.map((option) => (
              <Card
                key={option}
                className={cn(
                  'p-3 cursor-pointer text-center transition-all border-2',
                  selectedTimeline === option
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-transparent hover:border-gray-300'
                )}
                onClick={() => setValue('timeline', option)}
              >
                <span className="text-sm">{option}</span>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requirements">Mô tả yêu cầu</Label>
          <Textarea
            id="requirements"
            placeholder="Mô tả ngắn gọn về dự án hoặc yêu cầu của bạn..."
            rows={4}
            {...register('requirements')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center mb-6">
        Thông tin liên hệ
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Họ và tên *</Label>
          <Input
            id="name"
            placeholder="Nguyễn Văn A"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            placeholder="0912 345 678"
            {...register('phone')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Công ty</Label>
          <Input
            id="company"
            placeholder="Tên công ty (nếu có)"
            {...register('company')}
          />
        </div>
      </div>
      {/* Summary Box */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold mb-3">Tóm tắt yêu cầu</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Dịch vụ:</span>
          <span className="font-medium">{selectedService?.name || 'Chưa chọn'}</span>
          <span className="text-gray-500">Gói:</span>
          <span className="font-medium">
            {selectedTier
              ? `${selectedTier.name} - ${formatVNDPrice(selectedTier.price)}`
              : 'Chưa chọn'}
          </span>
          <span className="text-gray-500">Ngân sách:</span>
          <span className="font-medium">{selectedBudget || 'Chưa chọn'}</span>
          <span className="text-gray-500">Thời gian:</span>
          <span className="font-medium">{selectedTimeline || 'Chưa chọn'}</span>
        </div>
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <section
        id="quote-form"
        className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800"
      >
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Cảm ơn bạn!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Chúng tôi đã nhận được yêu cầu của bạn và sẽ liên hệ trong vòng 24
            giờ.
          </p>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setCurrentStep(0);
            }}
            variant="outline"
          >
            Gửi yêu cầu khác
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section
      id="quote-form"
      className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nhận báo giá miễn phí
          </h2>
          <p className="text-gray-300">
            Để lại thông tin, chúng tôi sẽ liên hệ tư vấn chi tiết cho bạn
          </p>
        </div>

        {renderProgressIndicator()}

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {currentStep === 0 && renderStep0()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={currentStep === 0 ? 'invisible' : ''}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="bg-rose-500 hover:bg-rose-600 text-white"
                disabled={submitQuote.isPending}
              >
                {submitQuote.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi yêu cầu
                  </>
                ) : (
                  <>
                    Tiếp theo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </section>
  );
}

