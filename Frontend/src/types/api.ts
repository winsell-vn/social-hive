/**
 * Shared API response types
 * Backend wraps responses with TransformInterceptor
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

