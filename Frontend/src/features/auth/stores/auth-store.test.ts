import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './auth-store';

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hydrated: false,
    });
  });

  describe('setTokens', () => {
    it('should be a no-op (tokens are in HttpOnly cookies)', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('access-token-123', 'refresh-token-456');
      });

      // SECURITY FIX: setTokens is now a no-op - tokens are in HttpOnly cookies
      // accessToken should remain null
      expect(result.current.accessToken).toBeNull();
      // isAuthenticated should NOT be set by setTokens - only by setUser
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set hydrated to true when setTokens is called', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hydrated).toBe(false);

      act(() => {
        result.current.setTokens('access-token-123', 'refresh-token-456');
      });

      // hydrated should still be set to true for backward compatibility
      expect(result.current.hydrated).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set isAuthenticated based on user presence', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setUser({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          avatar: null,
          bio: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.username).toBe('testuser');

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login flow', () => {
    it('should set isAuthenticated=true when setUser is called (tokens are in HttpOnly cookies)', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hydrated).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);

      // SECURITY FIX: Login now only calls setUser - tokens are in HttpOnly cookies
      act(() => {
        result.current.setUser({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          avatar: null,
          bio: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.username).toBe('testuser');
    });
  });

  describe('logout', () => {
    it('should clear state (cookies are cleared by backend)', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          avatar: null,
          bio: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      // State should be cleared
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
    });
  });
});
