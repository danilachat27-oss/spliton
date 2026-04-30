import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const AES_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class TwoFactorEncryptionService {
  constructor(private readonly configService: ConfigService) {}

  assertEncryptionConfigured(): void {
    if (!this.getRawKeyB64()) {
      throw new ServiceUnavailableException(
        'Two-factor encryption is not configured',
      );
    }
    try {
      this.getKeyBuffer();
    } catch {
      throw new ServiceUnavailableException(
        'Two-factor encryption key is invalid',
      );
    }
  }

  isConfigured(): boolean {
    const raw = this.getRawKeyB64();
    if (!raw) return false;
    try {
      this.getKeyBufferFromRaw(raw);
      return true;
    } catch {
      return false;
    }
  }

  encryptSecret(plaintextSecret: string): {
    ciphertextB64: string;
    ivB64: string;
    tagB64: string;
    encryptionKeyVersion: number;
  } {
    this.assertEncryptionConfigured();
    const key = this.getKeyBuffer();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(AES_ALGO, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintextSecret, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      ciphertextB64: encrypted.toString('base64'),
      ivB64: iv.toString('base64'),
      tagB64: tag.toString('base64'),
      encryptionKeyVersion: 1,
    };
  }

  decryptSecret(params: {
    ciphertextB64: string;
    ivB64: string;
    tagB64: string;
  }): string {
    this.assertEncryptionConfigured();
    const key = this.getKeyBuffer();
    const iv = Buffer.from(params.ivB64, 'base64');
    const tag = Buffer.from(params.tagB64, 'base64');
    const ciphertext = Buffer.from(params.ciphertextB64, 'base64');
    const decipher = createDecipheriv(AES_ALGO, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    try {
      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private getRawKeyB64(): string | undefined {
    return this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY')?.trim();
  }

  private getKeyBuffer(): Buffer {
    const raw = this.getRawKeyB64();
    if (!raw) {
      throw new ServiceUnavailableException(
        'Two-factor encryption is not configured',
      );
    }
    return this.getKeyBufferFromRaw(raw);
  }

  /** Base64-encoded 32-byte key (AES-256). */
  private getKeyBufferFromRaw(raw: string): Buffer {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== KEY_LENGTH) {
      throw new Error(
        'TWO_FACTOR_ENCRYPTION_KEY must decode to exactly 32 bytes',
      );
    }
    return buf;
  }
}
