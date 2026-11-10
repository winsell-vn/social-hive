import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  IStorageAdapter,
  StorageResult,
} from "../interfaces/storage.interface";
import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly storagePath: string;

  constructor(private configService: ConfigService) {
    this.storagePath = this.configService.get<string>(
      "upload.storagePath",
      "./uploads",
    );
  }

  /**
   * Generate hash-based subdirectory path from basename
   */
  private getHashPath(basename: string): string {
    const hash = createHash("sha256").update(basename).digest("hex");
    return path.join(hash.substring(0, 2), hash.substring(2, 4));
  }

  /**
   * Sanitize a path segment to prevent path traversal attacks.
   * Rejects segments containing '..' or absolute path indicators.
   */
  private sanitizeSegment(segment: string): string {
    // Reject empty segments
    if (!segment || segment.trim() === "") {
      throw new Error("Invalid path segment: empty segment");
    }
    // Reject path traversal attempts
    if (segment === ".." || segment.includes("..")) {
      throw new Error("Invalid path segment: path traversal detected");
    }
    // Reject absolute paths
    if (path.isAbsolute(segment)) {
      throw new Error("Invalid path segment: absolute path not allowed");
    }
    return segment;
  }

  async save(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult> {
    // Split filename into folder and basename parts
    const normalizedFilename = filename.replace(/\\/g, "/");
    const parts = normalizedFilename.split("/").filter((p) => p.length > 0);

    if (parts.length === 0) {
      throw new Error("Invalid filename: empty path");
    }

    // Sanitize each segment individually to prevent path traversal
    const sanitizedParts = parts.map((part) => this.sanitizeSegment(part));

    // Extract folder (all parts except last) and basename (last part)
    const basename = sanitizedParts[sanitizedParts.length - 1];
    const folder = sanitizedParts.slice(0, -1).join("/");

    // Generate hash-based subdirectory from basename
    const hashPath = this.getHashPath(basename);

    // Build full directory path: storagePath/folder/hashPath
    const dirPath = folder
      ? path.join(this.storagePath, folder, hashPath)
      : path.join(this.storagePath, hashPath);

    const filePath = path.join(dirPath, basename);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Build relative path including folder prefix
    const relativePath = folder
      ? `${folder}/${hashPath.replace(/\\/g, "/")}/${basename}`
      : `${hashPath.replace(/\\/g, "/")}/${basename}`;

    this.logger.log(`File saved: ${relativePath} (${buffer.length} bytes)`);

    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: buffer.length,
    };
  }

  /**
   * Sanitize file path to prevent path traversal attacks
   */
  private sanitizePath(filePath: string): string {
    // Normalize and resolve to prevent ../ attacks
    const normalized = path
      .normalize(filePath)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    // Ensure path doesn't escape storage directory
    const fullPath = path.resolve(this.storagePath, normalized);
    const resolvedStorage = path.resolve(this.storagePath);
    if (!fullPath.startsWith(resolvedStorage)) {
      throw new Error("Invalid file path: path traversal detected");
    }
    return normalized;
  }

  async read(filePath: string): Promise<Buffer> {
    const sanitized = this.sanitizePath(filePath);
    const fullPath = path.join(this.storagePath, sanitized);
    return fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const sanitized = this.sanitizePath(filePath);
    const fullPath = path.join(this.storagePath, sanitized);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${sanitized}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${sanitized}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const sanitized = this.sanitizePath(filePath);
    const fullPath = path.join(this.storagePath, sanitized);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
