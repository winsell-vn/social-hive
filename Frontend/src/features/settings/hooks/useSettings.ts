'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { useSettingsStore } from '../stores/settings-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  UpdateAccountInput,
  UpdatePrivacyInput,
  UpdateNotificationInput,
  ChangePasswordInput,
  SessionInfo,
  DeleteAccountResponse,
} from '../types/settings';

export function useSettings() {
  const queryClient = useQueryClient();
  const { setSettings, setSaving, setError } = useSettingsStore();

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: settingsApi.updateAccount,
    onMutate: () => setSaving(true),
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
    onSettled: () => setSaving(false),
  });

  // Update privacy mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: settingsApi.updatePrivacy,
    onMutate: () => setSaving(true),
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
    onSettled: () => setSaving(false),
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onMutate: () => setSaving(true),
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
    onSettled: () => setSaving(false),
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: settingsApi.changePassword,
    onMutate: () => setSaving(true),
    onError: (err: Error) => setError(err.message),
    onSettled: () => setSaving(false),
  });

  // Enable 2FA mutation
  const enable2FAMutation = useMutation({
    mutationFn: settingsApi.enable2FA,
    onError: (err: Error) => setError(err.message),
  });

  // Verify 2FA mutation
  const verify2FAMutation = useMutation({
    mutationFn: settingsApi.verify2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  // Disable 2FA mutation
  const disable2FAMutation = useMutation({
    mutationFn: settingsApi.disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: settingsApi.deleteAccount,
    onMutate: () => setSaving(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
    onSettled: () => setSaving(false),
  });

  // Cancel account deletion mutation
  const cancelDeletionMutation = useMutation({
    mutationFn: settingsApi.cancelAccountDeletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: settingsApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  // Revoke all sessions mutation
  const revokeAllSessionsMutation = useMutation({
    mutationFn: settingsApi.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return {
    settings,
    isLoading,
    error: error?.message || null,

    // Account
    updateAccount: (data: UpdateAccountInput) => updateAccountMutation.mutateAsync(data),
    isUpdatingAccount: updateAccountMutation.isPending,

    // Privacy
    updatePrivacy: (data: UpdatePrivacyInput) => updatePrivacyMutation.mutateAsync(data),
    isUpdatingPrivacy: updatePrivacyMutation.isPending,

    // Notifications
    updateNotifications: (data: UpdateNotificationInput) =>
      updateNotificationsMutation.mutateAsync(data),
    isUpdatingNotifications: updateNotificationsMutation.isPending,

    // Security
    changePassword: (data: ChangePasswordInput) => changePasswordMutation.mutateAsync(data),
    isChangingPassword: changePasswordMutation.isPending,

    // 2FA
    enable2FA: () => enable2FAMutation.mutateAsync(),
    isEnabling2FA: enable2FAMutation.isPending,
    verify2FA: (code: string) => verify2FAMutation.mutateAsync(code),
    isVerifying2FA: verify2FAMutation.isPending,
    disable2FA: (password: string) => disable2FAMutation.mutateAsync(password),
    isDisabling2FA: disable2FAMutation.isPending,

    // Delete account
    deleteAccount: (password: string) => deleteAccountMutation.mutateAsync(password),
    isDeletingAccount: deleteAccountMutation.isPending,

    // Cancel account deletion
    cancelAccountDeletion: () => cancelDeletionMutation.mutateAsync(),
    isCancellingDeletion: cancelDeletionMutation.isPending,

    // Sessions
    revokeSession: (sessionId: string) => revokeSessionMutation.mutateAsync(sessionId),
    isRevokingSession: revokeSessionMutation.isPending,
    revokeAllSessions: () => revokeAllSessionsMutation.mutateAsync(),
    isRevokingAllSessions: revokeAllSessionsMutation.isPending,
  };
}

// Separate hook for sessions query
export function useSessions() {
  const { isAuthenticated, hydrated } = useAuth();

  return useQuery({
    queryKey: ['sessions'],
    queryFn: settingsApi.getSessions,
    staleTime: 5 * 60 * 1000, // 5 minutes - sessions don't change frequently
    refetchOnWindowFocus: false, // Don't refetch on tab switch to reduce API calls
    // Only fetch sessions when user is authenticated and hydrated
    enabled: isAuthenticated && hydrated,
  });
}

