import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../email/email.service';
import { AuthRepository } from '../auth.repository';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
import { AuthAuditService } from './auth-audit.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { SessionService } from './session.service';
import { NotificationEventsService } from '../../notifications/notification-events.service';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export type ForgotPasswordResponse = { success: true };
export type ResetPasswordResponse = { success: true };

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly tokenService: PasswordResetTokenService,
    private readonly resetRepo: PasswordResetRepository,
    private readonly authRepo: AuthRepository,
    private readonly emailService: EmailService,
    private readonly authAudit: AuthAuditService,
    private readonly sessionService: SessionService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  async requestReset(
    email: string,
    meta?: RequestMeta,
  ): Promise<ForgotPasswordResponse> {
    const normalized = email.trim().toLowerCase();
    const user = await this.authRepo.findUserByEmail(normalized);
    if (!user?.passwordHash) {
      return { success: true };
    }

    const token = this.tokenService.generatePlaintextToken();
    const tokenHash = this.tokenService.hashToken(token);
    const expiresAt = this.tokenService.getTokenExpiryDate();
    const resetUrl = this.tokenService.buildResetUrl(token);

    await this.resetRepo.runTransaction(async (tx) => {
      await this.resetRepo.revokeActiveTokensForUser(user.id, tx);
      await this.resetRepo.createToken({
        userId: user.id,
        tokenHash,
        expiresAt,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
        tx,
      });
    });

    try {
      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        userId: user.id,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Unable to send password reset email',
      );
    }

    await this.authAudit.logEvent({
      event: 'PASSWORD_RESET_REQUESTED',
      actorUserId: user.id,
      entityId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: user.id },
    });

    return { success: true };
  }

  async resetPassword(
    token: string,
    password: string,
    meta?: RequestMeta,
  ): Promise<ResetPasswordResponse> {
    const tokenHash = this.tokenService.hashToken(token.trim());
    const row = await this.resetRepo.findTokenByHash(tokenHash);
    const invalidError = new UnauthorizedException(
      'Invalid or expired reset token',
    );

    if (
      !row ||
      row.usedAt ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      await this.authAudit.logEvent({
        event: 'PASSWORD_RESET_FAILED',
        actorUserId: row?.userId ?? null,
        entityId: row?.id ?? null,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { reason: 'INVALID_OR_EXPIRED' },
      });
      throw invalidError;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.resetRepo.runTransaction(async (tx) => {
      await this.resetRepo.markTokenUsed(row.id, tx);
      await this.resetRepo.revokeActiveTokensForUser(row.userId, tx);
      await this.resetRepo.updateUserPasswordHash(row.userId, passwordHash, tx);
    });

    await this.sessionService.revokeAllUserSessions({
      userId: row.userId,
      reason: 'password_reset',
    });

    await this.authAudit.logEvent({
      event: 'PASSWORD_RESET_COMPLETED',
      actorUserId: row.userId,
      entityId: row.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: row.userId },
    });

    void this.notificationEvents.passwordChanged(row.userId);

    return { success: true };
  }
}
