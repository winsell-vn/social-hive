import { apiClient } from '@/lib/api-client';
import type {
  UserSettings,
  UpdateAccountInput,
  UpdatePrivacyInput,
  UpdateNotificationInput,
  ChangePasswordInput,
  Enable2FAResponse,
  SessionInfo,
  SessionListResponse,
  RawSessionInfo,
  DeleteAccountResponse,
  CancelDeletionResponse,
  DeletionStatus,
} from '../types/settings';

// Helper function to parse user agent string
function parseUserAgent(userAgent: string | null): {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
} {
  if (!userAgent) {
    return { browser: 'Không xác định', os: 'Không xác định', deviceType: 'unknown' };
  }

  // Parse browser
  let browser = 'Không xác định';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Parse OS
  let os = 'Không xác định';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS') || userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iOS')) {
    os = 'iOS';
  }

  // Parse device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  if (userAgent.includes('Mobile') || (userAgent.includes('Android') && !userAgent.includes('Tablet'))) {
    deviceType = 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'tablet';
  } else if (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux')) {
    deviceType = 'desktop';
  }

  return { browser, os, deviceType };
}

export const settingsApi = {
  // Get user settings
  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get('/users/settings');
    return response.data.data;
  },

  // Update account settings
  updateAccount: async (data: UpdateAccountInput): Promise<UserSettings> => {
    const response = await apiClient.patch('/users/settings/account', data);
    return response.data.data;
  },

  // Update privacy settings
  updatePrivacy: async (data: UpdatePrivacyInput): Promise<UserSettings> => {
    const response = await apiClient.patch('/users/settings/privacy', data);
    return response.data.data;
  },

  // Update notification settings
  updateNotifications: async (data: UpdateNotificationInput): Promise<UserSettings> => {
    const response = await apiClient.patch('/users/settings/notifications', data);
    return response.data.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordInput): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  // Enable 2FA - returns secret, QR code, and backup codes
  enable2FA: async (): Promise<Enable2FAResponse> => {
    const response = await apiClient.post('/auth/2fa/enable');
    // Backend returns { secret, qrCode, backupCodes } directly without data wrapper
    // Handle both wrapped and unwrapped response formats
    return response.data.data || response.data;
  },

  // Verify and activate 2FA
  verify2FA: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/2fa/verify', { code });
    return response.data;
  },

  // Disable 2FA
  disable2FA: async (password: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/2fa/disable', { password });
    return response.data;
  },

  // Delete account (soft delete with 14-day grace period)
  deleteAccount: async (password: string): Promise<DeleteAccountResponse> => {
    const response = await apiClient.delete('/users/account', {
      data: { password },
    });
    return response.data;
  },

  // Cancel pending account deletion
  cancelAccountDeletion: async (): Promise<CancelDeletionResponse> => {
    const response = await apiClient.post('/users/account/cancel-deletion');
    return response.data;
  },

  // Get account deletion status
  getDeletionStatus: async (): Promise<DeletionStatus> => {
    const response = await apiClient.get('/users/account/deletion-status');
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Get active sessions
  getSessions: async (): Promise<SessionInfo[]> => {
    // Get refresh token to identify current session
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    const response = await apiClient.get('/auth/sessions', {
      headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
    });

    // Backend returns: { success, data: { data: [...], currentSessionId }, timestamp }
    // response.data is: { success, data: { data: [...], currentSessionId }, timestamp }
    // We need to extract the sessions array from response.data.data.data
    const responseData = response.data.data as SessionListResponse;
    const sessions = responseData.data;

    // Parse device info for each session
    return sessions.map((session) => {
      const parsed = parseUserAgent(session.deviceInfo);
      return {
        ...session,
        browser: parsed.browser,
        os: parsed.os,
        deviceType: parsed.deviceType,
      };
    });
  },

  // Revoke a specific session
  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    // Get refresh token to identify current session
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    const response = await apiClient.delete(`/auth/sessions/${sessionId}`, {
      headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
    });
    return response.data;
  },

  // Revoke all other sessions
  revokeAllSessions: async (): Promise<{ message: string; revokedCount: number }> => {
    // Get refresh token to identify current session
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    const response = await apiClient.delete('/auth/sessions', {
      headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
    });
    return response.data;
  },
};

