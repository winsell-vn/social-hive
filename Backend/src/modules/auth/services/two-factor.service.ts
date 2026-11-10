import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  generateSecret,
  generateURI,
  verify as verifyTotp,
  NobleCryptoPlugin,
  ScureBase32Plugin,
} from "otplib";
import * as QRCode from "qrcode";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

@Injectable()
export class TwoFactorService {
  private readonly appName: string;
  private readonly cryptoPlugin: NobleCryptoPlugin;
  private readonly base32Plugin: ScureBase32Plugin;

  constructor(private configService: ConfigService) {
    this.appName =
      this.configService.get<string>("APP_NAME") || "ChungToiXayWeb";
    this.cryptoPlugin = new NobleCryptoPlugin();
    this.base32Plugin = new ScureBase32Plugin();
  }

  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const secret = generateSecret({
      crypto: this.cryptoPlugin,
      base32: this.base32Plugin,
    });
    const otpauthUrl = generateURI({
      secret,
      issuer: this.appName,
      label: email,
    });

    return { secret, otpauthUrl };
  }

  /**
   * Generate QR code as data URL from otpauth URL
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  }

  /**
   * Verify a TOTP token against a secret
   */
  async verifyToken(secret: string, token: string): Promise<boolean> {
    try {
      const result = await verifyTotp({
        secret,
        token,
        crypto: this.cryptoPlugin,
        base32: this.base32Plugin,
        epochTolerance: 30, // Allow 30 seconds tolerance for clock drift
      });
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Generate 10 backup codes (8 characters each)
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash all backup codes for secure storage
   */
  async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes = await Promise.all(
      codes.map((code) => bcrypt.hash(code, 10)),
    );
    return hashedCodes;
  }

  /**
   * Verify a backup code against hashed codes
   * Returns the remaining codes (with the used one removed) if valid
   */
  async verifyBackupCode(
    code: string,
    hashedCodes: string[],
  ): Promise<{ valid: boolean; remainingCodes: string[] }> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(code.toUpperCase(), hashedCodes[i]);
      if (isMatch) {
        // Remove the used code
        const remainingCodes = [...hashedCodes];
        remainingCodes.splice(i, 1);
        return { valid: true, remainingCodes };
      }
    }
    return { valid: false, remainingCodes: hashedCodes };
  }

  /**
   * Check if a code is a backup code format (8 hex chars) vs TOTP (6 digits)
   */
  isBackupCode(code: string): boolean {
    // Backup codes are 8 hex characters
    return /^[A-Fa-f0-9]{8}$/.test(code);
  }
}
