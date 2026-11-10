import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/stores/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Fetch CSRF token from server (called on app init)
 */
export async function initCsrfToken(): Promise<void> {
  try {
    await axios.get(`${API_URL}/auth/csrf-token`, { withCredentials: true })
  } catch {
    // Ignore - CSRF token will be set on next GET request
  }
}

// Public endpoints that don't require authentication (GET requests only)
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/profiles/',
  '/posts',
]

// Request queue for handling concurrent 401 errors
interface QueuedRequest {
  resolve: (token: string | null) => void
  reject: (error: Error) => void
}

let isRefreshing = false
let failedRequestsQueue: QueuedRequest[] = []

/**
 * Process queued requests after token refresh
 */
function processQueue(error: Error | null, token: string | null = null): void {
  failedRequestsQueue.forEach((request) => {
    if (error) {
      request.reject(error)
    } else {
      request.resolve(token)
    }
  })
  failedRequestsQueue = []
}

/**
 * Check if an endpoint is public (doesn't require auth)
 * Only GET requests to public endpoints are considered public.
 * Write operations (POST, PUT, PATCH, DELETE) always require authentication.
 */
function isPublicEndpoint(url: string, method?: string): boolean {
  // Write operations always require authentication
  const writeMethod = method?.toUpperCase()
  if (writeMethod && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(writeMethod)) {
    return false
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

/**
 * Perform token refresh
 * Note: Both accessToken and refreshToken are sent/received via HttpOnly cookies
 * The response no longer contains tokens in the body
 */
async function performTokenRefresh(): Promise<void> {
  // Use axios directly to avoid infinite interceptor loop
  // The refreshToken cookie is sent automatically with withCredentials: true
  // New tokens are set in HttpOnly cookies by the backend
  await axios.post(
    `${API_URL}/auth/refresh`,
    {}, // Empty body - refreshToken comes from cookie
    { withCredentials: true }
  )
  // No need to update auth store - tokens are in HttpOnly cookies
}

/**
 * Handle session expiration - logout and show user-friendly message
 */
function handleSessionExpiration(): void {
  useAuthStore.getState().logout()

  // Show toast notification
  toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
    duration: 5000,
  })

  // Redirect to login page
  if (typeof window !== 'undefined') {
    // Use setTimeout to allow toast to show before redirect
    setTimeout(() => {
      window.location.href = '/login'
    }, 500)
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for HttpOnly cookies
})

/**
 * Request interceptor: Add CSRF token to non-GET requests
 *
 * SECURITY FIX: Proactive token refresh has been removed.
 * Tokens are now stored ONLY in HttpOnly cookies, not in memory.
 * The reactive refresh (401 → call /auth/refresh) handles token expiration.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token to non-GET requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfTokenFromCookie()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle 401 errors with token refresh and request queuing
 * - On 401: Queue request and try to refresh token
 * - If refresh succeeds: Retry all queued requests
 * - If refresh fails: Clear auth state, show toast, redirect to login
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Don't handle 401 for public endpoints - just reject silently
    if (error.response?.status === 401 && isPublicEndpoint(originalRequest.url || '', originalRequest.method)) {
      return Promise.reject(error)
    }

    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject })
        }).then(() => {
          // Retry request - cookies are sent automatically
          return apiClient(originalRequest)
        })
      }

      isRefreshing = true

      try {
        await performTokenRefresh()

        // Process all queued requests
        processQueue(null, null)
        isRefreshing = false

        // Retry original request - cookies are sent automatically
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Process queue with error
        processQueue(refreshError as Error, null)
        isRefreshing = false

        // Handle session expiration with user-friendly message
        handleSessionExpiration()

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

// Export utilities for testing and reuse
export { isPublicEndpoint, getCsrfTokenFromCookie }

// Initialize CSRF token on first load (client-side only)
if (typeof window !== 'undefined') {
  initCsrfToken()
}
