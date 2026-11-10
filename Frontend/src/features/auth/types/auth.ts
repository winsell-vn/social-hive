export interface User {
  id: string;
  email: string;
  profile: {
    username: string;
    displayName: string | null;
    avatar: string | null;
    bio: string | null;
  } | null;
  role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  tier: 'NEWCOMER' | 'CONTRIBUTOR' | 'EXPERT' | 'MASTER' | 'LEGEND';
  karma: number;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  turnstileToken: string;
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  tempToken?: string;
}

export interface Login2FAInput {
  code: string;
  tempToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
}

export interface ForgotPasswordInput {
  email: string;
  turnstileToken: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

