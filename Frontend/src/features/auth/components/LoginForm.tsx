'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AuthGlowCard } from './AuthGlowCard';
import { FloatingLabelInput } from './FloatingLabelInput';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorLoginModal } from './TwoFactorLoginModal';
import type { LoginInput } from '../types/auth';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu là bắt buộc'),
  rememberMe: z.boolean().optional().default(false),
  turnstileToken: TURNSTILE_SITE_KEY
    ? z.string().min(1, 'Vui lòng xác minh CAPTCHA')
    : z.string().optional().default(''),
});

type LoginFormData = z.infer<typeof loginSchema>;

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

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [show2FAModal, setShow2FAModal] = React.useState(false);
  const [tempToken, setTempToken] = React.useState('');
  const turnstileRef = React.useRef<any>(null);
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      turnstileToken: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      clearError();
      const result = await login(data);

      // Reset turnstile after submit
      turnstileRef.current?.reset();
      setValue('turnstileToken', '');

      // Check if 2FA is required
      if (result.requires2FA && result.tempToken) {
        setTempToken(result.tempToken);
        setShow2FAModal(true);
        return;
      }
    } catch {
      // Error is already handled by useAuth hook
      // Reset turnstile on error
      turnstileRef.current?.reset();
      setValue('turnstileToken', '');
    }
  };

  const handle2FASuccess = () => {
    router.push('/');
  };

  return (
    <AuthGlowCard>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl overflow-hidden">
              <Image src="/logo.webp" alt="ChungToiXayWeb" width={56} height={56} className="w-full h-full object-cover" priority />
            </div>
            <div className="absolute inset-0 rounded-xl bg-foreground/30 animate-ping" />
          </div>
        </motion.div>

        {/* Title & Subtitle */}
        <motion.div variants={itemVariants} className="text-center space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Chào mừng trở lại
          </h1>
          <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 0.4 }}
            className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-200 dark:border-red-900/50"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <motion.div
            variants={itemVariants}
            animate={{ x: errors.email ? [0, -8, 8, -8, 8, 0] : 0 }}
          >
            <FloatingLabelInput
              {...register('email')}
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              error={errors.email?.message}
              errorId="email-error"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            variants={itemVariants}
            animate={{ x: errors.password ? [0, -8, 8, -8, 8, 0] : 0 }}
          >
            <FloatingLabelInput
              {...register('password')}
              id="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isLoading}
              error={errors.password?.message}
              errorId="password-error"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </motion.div>

          {/* Remember Me + Forgot Password */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    className="border-border/50 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
              )}
            />
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </motion.div>

          {/* Turnstile CAPTCHA */}
          {TURNSTILE_SITE_KEY && (
            <motion.div variants={itemVariants} className="space-y-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => setValue('turnstileToken', token)}
                onError={() => setValue('turnstileToken', '')}
                onExpire={() => setValue('turnstileToken', '')}
              />
              {errors.turnstileToken && (
                <p className="text-xs text-red-500">
                  {errors.turnstileToken.message}
                </p>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-3 px-4 bg-foreground text-background font-medium rounded-xl transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </span>
            </button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-card text-muted-foreground">HOẶC</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-medium text-foreground hover:underline underline-offset-4 transition-colors"
          >
            Đăng ký
          </Link>
        </motion.p>
      </motion.div>

      {/* 2FA Verification Modal */}
      <TwoFactorLoginModal
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        tempToken={tempToken}
        onSuccess={handle2FASuccess}
      />
    </AuthGlowCard>
  );
}

