import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

// Extend Express Request to include cache metadata
declare global {
  namespace Express {
    interface Request {
      cacheMetadata?: {
        status: "HIT" | "MISS" | "BYPASS" | "ERROR";
        key?: string;
        age?: number;
        ttl?: number;
      };
    }
  }
}

@Injectable()
export class CacheDebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Add cache headers if metadata is available
        if (request.cacheMetadata) {
          const { status, key, age, ttl } = request.cacheMetadata;

          response.setHeader("X-Cache-Status", status);

          if (key) {
            // Sanitize key to remove sensitive data
            const sanitizedKey = this.sanitizeKey(key);
            response.setHeader("X-Cache-Key", sanitizedKey);
          }

          if (age !== undefined) {
            response.setHeader("X-Cache-Age", age.toString());
          }

          if (ttl !== undefined) {
            response.setHeader("X-Cache-TTL", ttl.toString());
          }
        }
      }),
    );
  }

  /**
   * Sanitize cache key to remove potentially sensitive information.
   * Only show the key pattern, not actual IDs.
   */
  private sanitizeKey(key: string): string {
    // Replace UUIDs with placeholder
    return key.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "{id}",
    );
  }
}
