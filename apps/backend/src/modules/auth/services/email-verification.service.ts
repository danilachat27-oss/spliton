import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { EmailService } from '../../email/email.service';
import { AuthRepository } from '../auth.repository';
import { EmailVerificationRepository } from '../repositories/email-verification.repository';
import type {
  EmailResendResponse,
  EmailVerifyResponse,
} from '../types/email-verification.types';
import { AuthAuditService } from './auth-audit.service';
import { EmailVerificationTokenService } from './email-verification-token.service';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly tokenService: EmailVerificationTokenService,
    private readonly emailRepo: EmailVerificationRepository,
    private readonly authRepo: AuthRepository,
    private readonly emailService: EmailService,
    private readonly authAudit: AuthAuditService,
  ) {}

  async issueForNewUser(params: {
    userId: string;
    email: string;
    meta?: RequestMeta;
  }): Promise<void> {
    await this.issueTokenAndSend(
      params.userId,
      params.email,
      params.meta,
      'SENT',
    );
  }

  async resend(
    email: string,
    meta?: RequestMeta,
  ): Promise<EmailResendResponse> {
    const normalized = email.trim().toLowerCase();
    const user = await this.authRepo.findUserByEmail(normalized);
    if (!user) {
      return { success: true };
    }
    if (user.status === UserStatus.ACTIVE) {
      return { success: true };
    }
    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      return { success: true };
    }

    await this.issueTokenAndSend(user.id, user.email, meta, 'RESENT');
    return { success: true };
  }

  async verifyToken(
    token: string,
    meta?: RequestMeta,
  ): Promise<EmailVerifyResponse> {
    const tokenHash = this.tokenService.hashToken(token.trim());
    const row = await this.emailRepo.findTokenByHash(tokenHash);
    const invalidError = new UnauthorizedException(
      'Invalid verification token',
    );

    if (
      !row ||
      row.usedAt ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      await this.authAudit.logEvent({
        event: 'EMAIL_VERIFICATION_FAILED',
        actorUserId: row?.userId ?? null,
        entityId: row?.id ?? null,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { reason: 'INVALID_OR_EXPIRED' },
      });
      throw invalidError;
    }

    await this.emailRepo.runTransaction(async (tx) => {
      await this.emailRepo.markTokenUsed(row.id, tx);
      await this.emailRepo.activateUser(row.userId, tx);
      await this.emailRepo.revokeActiveTokensForUser(row.userId, tx);
    });

    await this.authAudit.logEvent({
      event: 'EMAIL_VERIFIED',
      actorUserId: row.userId,
      entityId: row.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: row.userId, email: row.user.email },
    });

    return { verified: true };
  }

  private async issueTokenAndSend(
    userId: string,
    email: string,
    meta: RequestMeta | undefined,
    eventType: 'SENT' | 'RESENT',
  ): Promise<void> {
    const token = this.tokenService.generatePlaintextToken();
    const tokenHash = this.tokenService.hashToken(token);
    const expiresAt = this.tokenService.getTokenExpiryDate();
    const verifyUrl = this.tokenService.buildVerifyUrl(token);

    await this.emailRepo.runTransaction(async (tx) => {
      await this.emailRepo.revokeActiveTokensForUser(userId, tx);
      await this.emailRepo.createToken({
        userId,
        tokenHash,
        expiresAt,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        tx,
      });
    });

    try {
      await this.emailService.sendVerificationEmail({
        to: email,
        verifyUrl,
        userId,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Unable to send verification email',
      );
    }

    await this.authAudit.logEvent({
      event:
        eventType === 'RESENT'
          ? 'EMAIL_VERIFICATION_RESENT'
          : 'EMAIL_VERIFICATION_SENT',
      actorUserId: userId,
      entityId: userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, email },
    });
  }
}
