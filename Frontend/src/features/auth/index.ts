// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { ProtectedRoute } from './components/ProtectedRoute';
export { LoginPromptModal } from './components/LoginPromptModal';
export { TwoFactorLoginModal } from './components/TwoFactorLoginModal';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useRequireAuth } from './hooks/useRequireAuth';

// Store
export { useAuthStore } from './stores/auth-store';

// API hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useVerifyEmail,
  useResendVerificationEmail,
  useRefreshToken,
  useCurrentUser,
  useVerifyLogin2FA,
} from './api/auth';

// Types
export type {
  User,
  LoginInput,
  RegisterInput,
  AuthResponse,
  AuthState,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  Login2FAInput,
} from './types/auth';

