import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

const TOKEN_BYTES = 32;
const DEFAULT_TTL_HOURS = 24;

@Injectable()
export class EmailVerificationTokenService {
  constructor(private readonly configService: ConfigService) {}

  generatePlaintextToken(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  getTokenExpiryDate(): Date {
    const ttlHours =
      this.configService.get<number>('EMAIL_VERIFICATION_TOKEN_TTL_HOURS') ??
      DEFAULT_TTL_HOURS;
    return new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  }

  buildVerifyUrl(token: string): string {
    const baseUrl =
      this.configService.get<string>('APP_PUBLIC_URL')?.trim() ??
      'http://localhost:3000';
    const normalized = baseUrl.replace(/\/$/, '');
    return `${normalized}/verify-email?token=${encodeURIComponent(token)}`;
  }
}
