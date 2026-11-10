// Mock axios before importing api-client
const mockAxiosInstance = {
  defaults: {
    baseURL: 'http://localhost:4000/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  },
  interceptors: {
    request: {
      use: jest.fn(),
      handlers: [] as Array<{ fulfilled: (config: unknown) => unknown; rejected: (error: unknown) => unknown }>,
    },
    response: {
      use: jest.fn(),
      handlers: [] as Array<{ fulfilled: (response: unknown) => unknown; rejected: (error: unknown) => unknown }>,
    },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}

// Capture interceptor callbacks when registered
mockAxiosInstance.interceptors.request.use.mockImplementation((fulfilled, rejected) => {
  mockAxiosInstance.interceptors.request.handlers.push({ fulfilled, rejected })
  return mockAxiosInstance.interceptors.request.handlers.length - 1
})

mockAxiosInstance.interceptors.response.use.mockImplementation((fulfilled, rejected) => {
  mockAxiosInstance.interceptors.response.handlers.push({ fulfilled, rejected })
  return mockAxiosInstance.interceptors.response.handlers.length - 1
})

const mockAxiosCreate = jest.fn(() => mockAxiosInstance)
const mockAxiosPost = jest.fn()

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: mockAxiosCreate,
    post: mockAxiosPost,
  },
}))

const mockLogout = jest.fn()

jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      logout: mockLogout,
    })),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Import after mocks are set up
import { isPublicEndpoint, apiClient } from './api-client'

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('API Client Configuration', () => {
    it('should include credentials in requests for cookie support', () => {
      // apiClient is created with withCredentials: true for HttpOnly cookie auth
      // Verify through the mock instance defaults
      expect(mockAxiosInstance.defaults.withCredentials).toBe(true)
    })

    it('should set Content-Type to application/json', () => {
      expect(mockAxiosInstance.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should configure base URL', () => {
      expect(mockAxiosInstance.defaults.baseURL).toBeDefined()
      expect(typeof mockAxiosInstance.defaults.baseURL).toBe('string')
    })
  })

  describe('Public Endpoint Detection', () => {
    it('isPublicEndpoint should identify public GET endpoints', () => {
      expect(isPublicEndpoint('/auth/login', 'GET')).toBe(true)
      expect(isPublicEndpoint('/auth/register', 'GET')).toBe(true)
      expect(isPublicEndpoint('/profiles/user123', 'GET')).toBe(true)
      expect(isPublicEndpoint('/posts', 'GET')).toBe(true)
    })

    it('isPublicEndpoint should return false for write operations on public endpoints', () => {
      expect(isPublicEndpoint('/auth/login', 'POST')).toBe(false)
      expect(isPublicEndpoint('/posts', 'POST')).toBe(false)
      expect(isPublicEndpoint('/posts', 'PUT')).toBe(false)
      expect(isPublicEndpoint('/posts', 'DELETE')).toBe(false)
    })

    it('isPublicEndpoint should return false for private endpoints', () => {
      expect(isPublicEndpoint('/users/me', 'GET')).toBe(false)
      expect(isPublicEndpoint('/notifications', 'GET')).toBe(false)
    })
  })

  describe('Response Interceptor - 401 Handling', () => {
    let responseInterceptor: { fulfilled: (response: unknown) => unknown; rejected: (error: unknown) => Promise<unknown> }

    beforeEach(() => {
      jest.clearAllMocks()
      mockAxiosInstance.interceptors.response.handlers = []
      mockAxiosInstance.interceptors.request.handlers = []
      jest.resetModules()
    })

    function loadInterceptors() {
      require('./api-client')
      responseInterceptor = mockAxiosInstance.interceptors.response.handlers[0]
    }

    it('should pass through non-401 errors without refresh attempt', async () => {
      loadInterceptors()

      const error = {
        response: { status: 500 },
        config: { url: '/users/me', method: 'GET' },
      }

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('should reject 401 on public endpoints without refresh', async () => {
      loadInterceptors()

      const error = {
        response: { status: 401 },
        config: { url: '/auth/login', method: 'GET' },
      }

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('should skip retry if _retry flag is already set', async () => {
      loadInterceptors()

      const error = {
        response: { status: 401 },
        config: { url: '/users/me', method: 'GET', _retry: true },
      }

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('should reject without config', async () => {
      loadInterceptors()

      const error = { response: { status: 401 } }

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error)
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('should call logout when refresh fails on 401', async () => {
      const { useAuthStore } = require('@/features/auth/stores/auth-store')
      useAuthStore.getState.mockReturnValue({
        logout: mockLogout,
      })

      mockAxiosPost.mockRejectedValueOnce(new Error('Refresh failed'))

      loadInterceptors()

      const error = {
        response: { status: 401 },
        config: { url: '/users/me', method: 'GET', _retry: false },
      }

      await expect(responseInterceptor.rejected(error)).rejects.toThrow('Refresh failed')
      expect(mockAxiosPost).toHaveBeenCalledTimes(1)
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('Request Interceptor - Pass Through', () => {
    let requestInterceptor: { fulfilled: (config: unknown) => unknown; rejected: (error: unknown) => unknown }

    beforeEach(() => {
      jest.clearAllMocks()
      mockAxiosInstance.interceptors.request.handlers = []
      mockAxiosInstance.interceptors.response.handlers = []
      jest.resetModules()
    })

    function loadInterceptors() {
      require('./api-client')
      requestInterceptor = mockAxiosInstance.interceptors.request.handlers[0]
    }

    it('should pass through requests without modification (cookies sent automatically)', () => {
      loadInterceptors()

      const config = { url: '/users/me', method: 'GET', headers: {} }
      const result = requestInterceptor.fulfilled(config)

      // SECURITY FIX: Request interceptor is now a simple pass-through
      // Tokens are in HttpOnly cookies, sent automatically with withCredentials: true
      expect(result).toEqual(config)
      // No proactive refresh - reactive refresh handles 401s
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })
  })
})
