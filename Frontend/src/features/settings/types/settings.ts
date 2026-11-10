export interface DeletionStatus {
  isScheduledForDeletion: boolean;
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  daysRemaining: number | null;
}

export interface UserSettings {
  id: string;
  userId: string;
  // Account settings
  email: string;
  displayName: string;
  username: string;
  bio: string | null;
  // Privacy settings
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowMessagesFrom: 'everyone' | 'friends' | 'none';
  showActivityStatus: boolean;
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  notifyOnMessage: boolean;
  // Security
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  // Deletion status (only present if user has pending deletion)
  deletionStatus?: DeletionStatus;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  ipAddress: string | null;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// Raw session data from backend (before parsing)
export interface RawSessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SessionListResponse {
  data: RawSessionInfo[];
  currentSessionId: string | null;
}

export interface UpdateAccountInput {
  displayName?: string;
  bio?: string;
  email?: string;
}

export interface UpdatePrivacyInput {
  profileVisibility?: 'public' | 'friends' | 'private';
  showOnlineStatus?: boolean;
  allowMessagesFrom?: 'everyone' | 'friends' | 'none';
  showActivityStatus?: boolean;
}

export interface UpdateNotificationInput {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notifyOnLike?: boolean;
  notifyOnComment?: boolean;
  notifyOnFollow?: boolean;
  notifyOnMention?: boolean;
  notifyOnMessage?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountInput {
  password: string;
  confirmation: string;
}

export interface DeleteAccountResponse {
  message: string;
  deletionScheduledFor: string;
}

export interface CancelDeletionResponse {
  message: string;
}

export type SettingsTab = 'account' | 'privacy' | 'notifications' | 'security';

