'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { cn } from '@/lib/utils';
import { AuthGlowCard } from './AuthGlowCard';
import { FloatingLabelInput } from './FloatingLabelInput';
import { useAuth } from '../hooks/useAuth';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ'),
  username: z
    .string()
    .min(3, 'Tên người dùng phải có ít nhất 3 ký tự')
    .max(30, 'Tên người dùng không được quá 30 ký tự')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới'
    ),
  displayName: z
    .string()
    .max(50, 'Tên hiển thị không được quá 50 ký tự')
    .optional(),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Xác nhận mật khẩu là bắt buộc'),
  turnstileToken: TURNSTILE_SITE_KEY
    ? z.string().min(1, 'Vui lòng xác minh CAPTCHA')
    : z.string().optional().default(''),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

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

function getPasswordStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const turnstileRef = React.useRef<any>(null);
  const { register: registerUser, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      turnstileToken: '',
    },
  });

  const passwordValue = watch('password') || '';
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const result = await registerUser({
      email: data.email,
      username: data.username,
      password: data.password,
      displayName: data.displayName || undefined,
      turnstileToken: data.turnstileToken,
    });

    // Reset turnstile after submit
    turnstileRef.current?.reset();
    setValue('turnstileToken', '');

    if (result.success) {
      const requiresVerification = result.data?.requiresEmailVerification ?? true;
      if (!requiresVerification) {
        toast.success('Đăng ký thành công! Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.');
        router.push('/login');
        return;
      }

      if (result.data?.verificationEmailSent === false) {
        toast.warning(
          'Đăng ký thành công, nhưng chưa thể gửi email xác thực. Bạn có thể yêu cầu gửi lại email.',
          { duration: 8000 }
        );
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
    }
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
            Tạo tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">Tham gia cộng đồng Chung Tôi Xây Web</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <motion.div variants={itemVariants} animate={{ x: errors.email ? [0, -8, 8, -8, 8, 0] : 0 }}>
            <FloatingLabelInput
              {...register('email')}
              id="reg-email"
              label="Email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              error={errors.email?.message}
              errorId="reg-email-error"
            />
          </motion.div>

          {/* Username */}
          <motion.div variants={itemVariants} animate={{ x: errors.username ? [0, -8, 8, -8, 8, 0] : 0 }}>
            <FloatingLabelInput
              {...register('username')}
              id="reg-username"
              label="Tên người dùng"
              type="text"
              autoComplete="username"
              disabled={isLoading}
              error={errors.username?.message}
              errorId="reg-username-error"
            />
          </motion.div>

          {/* Display Name */}
          <motion.div variants={itemVariants}>
            <FloatingLabelInput
              {...register('displayName')}
              id="reg-displayName"
              label="Tên hiển thị (tùy chọn)"
              type="text"
              disabled={isLoading}
              error={errors.displayName?.message}
              errorId="reg-displayName-error"
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} animate={{ x: errors.password ? [0, -8, 8, -8, 8, 0] : 0 }}>
            <FloatingLabelInput
              {...register('password')}
              id="reg-password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isLoading}
              error={errors.password?.message}
              errorId="reg-password-error"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {/* Password Strength Meter */}
            {passwordValue.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={cn("h-1 flex-1 rounded-full transition-all duration-300", strength >= level ? "bg-foreground" : "bg-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {strength === 0 && 'Nhập mật khẩu'}
                  {strength === 1 && 'Yếu'}
                  {strength === 2 && 'Trung bình'}
                  {strength === 3 && 'Tốt'}
                  {strength === 4 && 'Mạnh'}
                </p>
              </div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={itemVariants} animate={{ x: errors.confirmPassword ? [0, -8, 8, -8, 8, 0] : 0 }}>
            <FloatingLabelInput
              {...register('confirmPassword')}
              id="reg-confirmPassword"
              label="Xác nhận mật khẩu"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isLoading}
              error={errors.confirmPassword?.message}
              errorId="reg-confirmPassword-error"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
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
                <p className="text-xs text-red-500">{errors.turnstileToken.message}</p>
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
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </span>
            </button>
          </motion.div>

          {/* Terms & Privacy Agreement */}
          <motion.p variants={itemVariants} className="text-xs text-muted-foreground text-center">
            Khi bạn đăng ký và sử dụng chungtoixayweb.vn, bạn đồng ý với các{' '}
            <Link href="/dieu-khoan" className="text-foreground hover:underline underline-offset-2">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link href="/chinh-sach-bao-mat" className="text-foreground hover:underline underline-offset-2">
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi.
          </motion.p>
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
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline underline-offset-4 transition-colors">
            Đăng nhập
          </Link>
        </motion.p>
      </motion.div>
    </AuthGlowCard>
  );
}

