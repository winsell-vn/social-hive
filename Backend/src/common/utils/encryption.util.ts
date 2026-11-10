/**
 * Encryption utility for AES-256-GCM encryption/decryption
 * Used for encrypting sensitive data like API keys at rest
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.AI_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("AI_ENCRYPTION_KEY environment variable is not set");
  }

  // If key is hex string (64 chars), convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }

  // If key is base64 (44 chars), convert to buffer
  if (key.length === 44) {
    return Buffer.from(key, "base64");
  }

  // Otherwise, hash the key to get 32 bytes
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Object containing encrypted data, IV, and auth tag (all base64 encoded)
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 * @param encryptedData - Object containing encrypted data, IV, and auth tag
 * @returns The decrypted plaintext string
 */
export function decrypt(encryptedData: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, "base64");
  const authTag = Buffer.from(encryptedData.authTag, "base64");
  const encryptedText = Buffer.from(encryptedData.encryptedKey, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Generate a new random encryption key
 * @returns A 32-byte key as hex string (64 characters)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate that an encryption key is properly formatted
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncryptionKey(key: string): boolean {
  if (!key) return false;

  // Check for hex format (64 chars)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return true;
  }

  // Check for base64 format (44 chars)
  if (key.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(key)) {
    return true;
  }

  // Any other string will be hashed, so it's technically valid
  return key.length >= 16;
}
