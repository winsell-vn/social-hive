'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGlowCard } from './AuthGlowCard';
import { FloatingLabelInput } from './FloatingLabelInput';
import { useForgotPassword } from '../api/auth';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ'),
  turnstileToken: TURNSTILE_SITE_KEY
    ? z.string().min(1, 'Vui lòng xác minh CAPTCHA')
    : z.string().optional().default(''),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const turnstileRef = React.useRef<any>(null);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof forgotPasswordSchema>, unknown, z.output<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      turnstileToken: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setHasError(false);
      await forgotPassword.mutateAsync(data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      toast.error(message);
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
      turnstileRef.current?.reset();
      setValue('turnstileToken', '');
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
  };

  return (
    <AuthGlowCard>
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            {/* Animated Checkmark */}
            <motion.div variants={itemVariants}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto"
              >
                <Check size={32} strokeWidth={3} />
              </motion.div>
            </motion.div>

            {/* Success Title */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Email đã được gửi!
              </h1>
              <p className="text-sm text-muted-foreground">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                <span className="font-medium text-foreground">{submittedEmail}</span>
              </p>
            </motion.div>

            {/* Try Again Button */}
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={handleTryAgain}
                className="w-full py-3 px-4 rounded-xl bg-secondary/50 border border-border/50 text-sm font-medium text-foreground hover:bg-secondary/70 transition-all duration-200"
              >
                Thử lại
              </button>
            </motion.div>

            {/* Back to Login */}
            <motion.div variants={itemVariants}>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              variants={hasError ? shakeVariants : {}}
              animate={hasError ? 'shake' : ''}
            >
              {/* Logo */}
              <motion.div variants={itemVariants} className="flex justify-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <Image src="/logo.webp" alt="ChungToiXayWeb" width={48} height={48} className="w-full h-full object-cover" priority />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-foreground/30 animate-ping" />
                </div>
              </motion.div>

              {/* Title & Subtitle */}
              <motion.div variants={itemVariants} className="text-center space-y-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Đặt lại mật khẩu
                </h1>
                <p className="text-sm text-muted-foreground">
                  Nhập email để nhận link đặt lại mật khẩu
                </p>
              </motion.div>

              {/* Email Input - Floating Label */}
              <motion.div variants={itemVariants}>
                <FloatingLabelInput
                  {...register('email')}
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  disabled={forgotPassword.isPending}
                  error={errors.email?.message}
                  errorId="email-error"
                />
              </motion.div>

              {/* Turnstile CAPTCHA */}
              {TURNSTILE_SITE_KEY && (
                <motion.div variants={itemVariants} className="space-y-1">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={(token) => setValue('turnstileToken', token)}
                    onError={() => setValue('turnstileToken', '')}
                    onExpire={() => setValue('turnstileToken', '')}
                  />
                  {errors.turnstileToken && (
                    <p className="text-xs text-red-500 pl-1">
                      {errors.turnstileToken.message}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Submit Button with Shimmer */}
              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={forgotPassword.isPending}
                  className="relative w-full py-3 px-4 rounded-xl bg-foreground text-background text-sm font-medium overflow-hidden transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {forgotPassword.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi link đặt lại'
                    )}
                  </span>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </motion.div>

              {/* Back to Login */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <ArrowLeft size={16} />
                  Quay lại đăng nhập
                </Link>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthGlowCard>
  );
}

