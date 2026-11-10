import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '../stores/auth-store';
import type {
  User,
  LoginInput,
  RegisterInput,
  AuthResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  Login2FAInput,
} from '../types/auth';

const AUTH_KEY = 'auth';
const USER_KEY = 'currentUser';

// Login mutation - now returns AuthResponse which may require 2FA
export function useLogin() {
  const { setUser, setError, setRememberMe } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', data);
      return { ...response.data.data, rememberMe: data.rememberMe ?? false };
    },
    onSuccess: (data) => {
      // Store rememberMe preference
      setRememberMe(data.rememberMe);

      // Only set user if 2FA is not required
      // Tokens are now in HttpOnly cookies - no longer in response body
      if (!data.requires2FA && data.user) {
        setUser(data.user);
      }
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] useLogin.onError: errorData=' + JSON.stringify(error.response?.data) + ' message=' + (error.response?.data?.message || 'none'));
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      setError(message);
    },
  });
}

// 2FA Login verification mutation
export function useVerifyLogin2FA() {
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: async (data: Login2FAInput) => {
      const response = await apiClient.post<{ data: AuthResponse }>('/auth/2fa/verify-login', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Tokens are now in HttpOnly cookies - no longer in response body
      if (data.user) {
        setUser(data.user);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Xác thực 2FA thất bại';
      setError(message);
    },
  });
}

// Register mutation
export function useRegister() {
  const { setError } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiClient.post<{
        data: {
          userId: string;
          message: string;
          requiresEmailVerification: boolean;
          verificationEmailSent: boolean;
        };
      }>('/auth/register', data);
      return response.data.data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      setError(message);
    },
  });
}

// Logout mutation
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Call logout endpoint - refreshToken is sent via HttpOnly cookie
      await apiClient.post('/auth/logout', {});
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Forgot password mutation
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/forgot-password',
        data
      );
      return response.data.data;
    },
  });
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/reset-password',
        {
          token: data.token,
          password: data.password,
        }
      );
      return response.data.data;
    },
  });
}

// Verify email mutation
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (data: VerifyEmailInput) => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/verify-email',
        data
      );
      return response.data.data;
    },
  });
}

// Resend verification email mutation
export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/resend-verification-email',
        data
      );
      return response.data.data;
    },
  });
}

// Refresh token mutation
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      // refreshToken is sent via HttpOnly cookie automatically
      // Response no longer contains tokens - they're set in HttpOnly cookies
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/refresh',
        {} // Empty body - refreshToken comes from cookie
      );
      return response.data.data;
    },
    // No onSuccess needed - tokens are in HttpOnly cookies
  });
}

// Get current user query
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [AUTH_KEY, USER_KEY],
    queryFn: async () => {
      const response = await apiClient.get<{ data: User }>('/auth/me');
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

