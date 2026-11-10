import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { promises as fsPromises } from "fs";
import { join, resolve } from "path";

/**
 * Check if a file exists asynchronously (non-blocking).
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate path for security - reject path traversal attempts.
 */
function isPathSafe(relativePath: string): boolean {
  return !relativePath.includes("..") && !relativePath.includes("\0");
}

/**
 * Middleware to handle legacy flat paths for uploaded files.
 * When a file is not found at the flat path (e.g., /uploads/avatars/file.webp),
 * this middleware tries to find it using hash-based subdirectories
 * (e.g., /uploads/avatars/ab/cd/file.webp).
 *
 * This provides backward compatibility for URLs stored in the database
 * before hash-based storage was implemented.
 */
@Injectable()
export class HashPathFallbackMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HashPathFallbackMiddleware.name);
  private readonly uploadsPath: string;

  constructor() {
    // Resolve uploads path relative to project root
    this.uploadsPath = resolve(process.cwd(), "uploads");
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Only handle GET requests for /uploads/
    if (req.method !== "GET" || !req.path.startsWith("/uploads/")) {
      return next();
    }

    // Get the relative path after /uploads/
    const relativePath = req.path.replace("/uploads/", "");

    // Security: reject path traversal attempts
    if (!isPathSafe(relativePath)) {
      return next();
    }

    const fullPath = join(this.uploadsPath, relativePath);

    // Check if file exists at the flat path (async)
    if (await fileExists(fullPath)) {
      // File exists at flat path, let static middleware handle it
      return next();
    }

    // File not found at flat path, try hash-based path
    const hashPath = await this.tryHashBasedPath(relativePath);
    if (hashPath) {
      // Redirect to the hash-based path
      const newUrl = `/uploads/${hashPath}`;
      this.logger.debug(`Redirecting ${req.path} to ${newUrl}`);
      return res.redirect(301, newUrl);
    }

    // No hash-based path found either, let it 404
    return next();
  }

  /**
   * Try to find the file using hash-based subdirectories.
   * Given a path like "avatars/file.webp", tries "avatars/ab/cd/file.webp"
   * where ab/cd is derived from SHA-256 hash of the filename.
   */
  private async tryHashBasedPath(relativePath: string): Promise<string | null> {
    // Split path into folder and filename
    const parts = relativePath.split("/");
    if (parts.length < 1) return null;

    const filename = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join("/");

    // Generate hash-based subdirectory from filename
    const hash = createHash("sha256").update(filename).digest("hex");
    const hashSubdir = `${hash.substring(0, 2)}/${hash.substring(2, 4)}`;

    // Build hash-based path
    const hashBasedPath = folder
      ? `${folder}/${hashSubdir}/${filename}`
      : `${hashSubdir}/${filename}`;

    const fullHashPath = join(this.uploadsPath, hashBasedPath);

    // Check if file exists at hash-based path (async)
    if (await fileExists(fullHashPath)) {
      return hashBasedPath;
    }

    return null;
  }
}

/**
 * Factory function to create hash-path fallback middleware for Express.
 * Use this in main.ts before static assets middleware.
 *
 * @param uploadsPath - Absolute path to the uploads directory
 */
export function createHashPathFallbackMiddleware(uploadsPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const relativePath = req.path.replace(/^\//, "");

    // Security: reject path traversal attempts
    if (!isPathSafe(relativePath)) {
      return next();
    }

    const fullPath = join(uploadsPath, relativePath);

    // If file exists at flat path, let static middleware handle it
    if (await fileExists(fullPath)) {
      return next();
    }

    // Try hash-based path
    const parts = relativePath.split("/");
    if (parts.length < 1) return next();

    const filename = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join("/");
    const hash = createHash("sha256").update(filename).digest("hex");
    const hashSubdir = `${hash.substring(0, 2)}/${hash.substring(2, 4)}`;
    const hashBasedPath = folder
      ? `${folder}/${hashSubdir}/${filename}`
      : `${hashSubdir}/${filename}`;
    const fullHashPath = join(uploadsPath, hashBasedPath);

    if (await fileExists(fullHashPath)) {
      return res.redirect(301, `/uploads/${hashBasedPath}`);
    }

    return next();
  };
}

