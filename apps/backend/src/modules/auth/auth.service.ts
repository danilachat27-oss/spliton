import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConsentSource, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuthRepository } from './auth.repository';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  TwoFactorDisableDto,
  TwoFactorRegenerateRecoveryCodesDto,
  TwoFactorVerifyDto,
  TwoFactorVerifySetupDto,
  VerifyEmailDto,
} from './dto';
import { AuthAuditService } from './services/auth-audit.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import type { AuthLoginResult } from './types/auth-login-result.type';
import { AuthResponse, SafeUserResponse } from './types/auth-response.type';
import { AuthUser } from './types/auth-user.type';
import type {
  EmailResendResponse,
  EmailVerifyResponse,
  RegisterEmailVerificationResponse,
} from './types/email-verification.types';
import {
  assertUserCanLogin,
  prismaUserToSafeUser,
} from './utils/safe-user.mapper';
import { LegalConsentsService } from '../legal/legal-consents.service';
import { ReferralsService } from '../referrals/referrals.service';
import { ReferralEventsService } from '../referrals/referral-events.service';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly authAuditService: AuthAuditService,
    private readonly twoFactorService: TwoFactorService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly legalConsents: LegalConsentsService,
    private readonly referrals: ReferralsService,
    private readonly referralEvents: ReferralEventsService,
  ) {}

  async register(
    dto: RegisterDto,
    meta?: RequestMeta,
  ): Promise<RegisterEmailVerificationResponse> {
    if (!dto.acceptedTerms || !dto.acceptedPrivacy) {
      throw new BadRequestException(
        'Необходимо принять условия использования и политику конфиденциальности Spliton',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;
    try {
      user = await this.authRepository.createInvestorUser({
        email,
        passwordHash,
        displayName: dto.displayName,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
      });
    } catch {
      throw new InternalServerErrorException('Unable to create user');
    }

    await this.authAuditService.logEvent({
      event: 'REGISTER',
      actorUserId: user.id,
      entityId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: user.id, email: user.email },
    });
    await this.legalConsents.recordConsentsForSource(
      user.id,
      ConsentSource.REGISTER,
      { ip: meta?.ip, userAgent: meta?.userAgent },
    );
    await this.emailVerificationService.issueForNewUser({
      userId: user.id,
      email: user.email,
      meta,
    });

    if (dto.referralCode?.trim()) {
      try {
        await this.referrals.attachOnRegistration(user.id, dto.referralCode, {
          utmSource: dto.utmSource,
          utmCampaign: dto.utmCampaign,
        });
      } catch {
        /* invalid/self referral must not block registration */
      }
    }

    return { requiresEmailVerification: true };
  }

  async login(dto: LoginDto, meta?: RequestMeta): Promise<AuthLoginResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    // Avoid leaking whether email exists or password was wrong.
    if (!user?.passwordHash) {
      await this.authAuditService.logEvent({
        event: 'LOGIN_FAILED',
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { email, reason: 'INVALID_CREDENTIALS' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await this.authAuditService.logEvent({
        event: 'LOGIN_FAILED',
        actorUserId: user.id,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: user.id, email, reason: 'INVALID_CREDENTIALS' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      await this.authAuditService.logEvent({
        event: 'EMAIL_VERIFICATION_REQUIRED',
        actorUserId: user.id,
        entityId: user.id,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: user.id, email },
      });
      throw new ForbiddenException({
        message: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification required',
        },
      });
    }
    assertUserCanLogin(user.status);

    const has2fa = await this.twoFactorService.isTotpEnabledForUser(user.id);
    if (has2fa) {
      const challengeId = await this.twoFactorService.createLoginChallenge(
        user.id,
        meta,
      );
      return {
        requires2fa: true,
        challengeId,
        availableMethods: ['totp', 'backup_code'],
      };
    }

    const safeUser = prismaUserToSafeUser(user);
    const tokens = await this.issueSessionAndTokens({
      user: safeUser,
      meta,
    });

    await this.authAuditService.logEvent({
      event: 'LOGIN_SUCCESS',
      actorUserId: safeUser.id,
      entityId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, email: safeUser.email },
    });

    return {
      user: safeUser,
      tokens,
    };
  }

  async twoFactorSetup(user: AuthUser, meta?: RequestMeta) {
    return this.twoFactorService.setup(user.id, user.email, meta);
  }

  async twoFactorVerifySetup(
    user: AuthUser,
    dto: TwoFactorVerifySetupDto,
    meta?: RequestMeta,
  ) {
    return this.twoFactorService.verifySetup(user.id, dto.code, meta);
  }

  async twoFactorVerify(dto: TwoFactorVerifyDto, meta?: RequestMeta) {
    return this.twoFactorService.verifyChallengeAndLogin({
      challengeId: dto.challengeId,
      code: dto.code,
      method: dto.method,
      meta,
    });
  }

  async twoFactorDisable(
    user: AuthUser,
    dto: TwoFactorDisableDto,
    meta?: RequestMeta,
  ) {
    const full = await this.authRepository.findUserById(user.id);
    if (!full?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.twoFactorService.disable(
      user.id,
      dto.password,
      dto.code,
      dto.method,
      full.passwordHash,
      meta,
    );
  }

  async twoFactorRegenerateRecoveryCodes(
    user: AuthUser,
    dto: TwoFactorRegenerateRecoveryCodesDto,
    meta?: RequestMeta,
  ) {
    return this.twoFactorService.regenerateRecoveryCodes(
      user.id,
      dto.code,
      meta,
    );
  }

  async verifyEmail(
    dto: VerifyEmailDto,
    meta?: RequestMeta,
  ): Promise<EmailVerifyResponse> {
    const result = await this.emailVerificationService.verifyToken(
      dto.token,
      meta,
    );
    if (result.verified && result.userId) {
      void this.referralEvents.onEmailVerified(result.userId);
    }
    return result;
  }

  async resendEmailVerification(
    dto: ResendEmailVerificationDto,
    meta?: RequestMeta,
  ): Promise<EmailResendResponse> {
    return this.emailVerificationService.resend(dto.email, meta);
  }

  forgotPassword(dto: ForgotPasswordDto, meta?: RequestMeta) {
    return this.passwordResetService.requestReset(dto.email, meta);
  }

  resetPassword(dto: ResetPasswordDto, meta?: RequestMeta) {
    return this.passwordResetService.resetPassword(
      dto.token,
      dto.password,
      meta,
    );
  }

  async refresh(
    dto: RefreshTokenDto,
    meta?: RequestMeta,
  ): Promise<AuthResponse> {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );
    const session = await this.sessionService.findSessionById(
      payload.sessionId,
    );

    if (!session || session.userId !== payload.sub) {
      await this.authAuditService.logEvent({
        event: 'REFRESH_FAILED',
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: 'SESSION_NOT_FOUND',
        },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      this.sessionService.isSessionExpired(session) ||
      this.sessionService.isSessionRevoked(session)
    ) {
      const isRotationReuse = session.revokedReason === 'ROTATED';
      if (isRotationReuse) {
        await this.sessionService.revokeAllUserSessions({
          userId: payload.sub,
          reason: 'REFRESH_REUSE_DETECTED',
        });
      }

      await this.authAuditService.logEvent({
        event: isRotationReuse ? 'REFRESH_REUSE_DETECTED' : 'REFRESH_FAILED',
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: isRotationReuse ? 'ROTATED_TOKEN_REUSE' : 'SESSION_INACTIVE',
        },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshMatches = await this.sessionService.verifySessionRefreshToken(
      session,
      dto.refreshToken,
    );
    if (!refreshMatches) {
      await this.sessionService.revokeAllUserSessions({
        userId: payload.sub,
        reason: 'REFRESH_REUSE_DETECTED',
      });
      await this.authAuditService.logEvent({
        event: 'REFRESH_REUSE_DETECTED',
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: 'HASH_MISMATCH',
        },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      await this.authAuditService.logEvent({
        event: 'REFRESH_FAILED',
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: 'USER_NOT_FOUND',
        },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    assertUserCanLogin(user.status);
    const safeUser = prismaUserToSafeUser(user);
    const newSessionId = randomUUID();
    const finalTokens = await this.tokenService.generateTokenPair({
      userId: safeUser.id,
      email: safeUser.email,
      roles: safeUser.roles,
      sessionId: newSessionId,
    });

    const newSession = await this.sessionService.rotateSession({
      currentSession: session,
      newSessionId,
      refreshToken: finalTokens.refreshToken,
      expiresAt: this.tokenService.getRefreshExpiryDate(),
      meta,
    });

    await this.authAuditService.logEvent({
      event: 'REFRESH_SUCCESS',
      actorUserId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, sessionId: newSession.id },
    });

    return { user: safeUser, tokens: finalTokens };
  }

  async logout(dto: LogoutDto, meta?: RequestMeta) {
    try {
      if (!dto.refreshToken) {
        return { success: true };
      }
      const payload = await this.tokenService.verifyRefreshToken(
        dto.refreshToken,
      );
      const session = await this.sessionService.findSessionById(
        payload.sessionId,
      );

      if (
        session &&
        session.userId === payload.sub &&
        !this.sessionService.isSessionRevoked(session)
      ) {
        await this.sessionService.revokeSession({
          sessionId: session.id,
          reason: 'LOGOUT',
        });
        await this.authAuditService.logEvent({
          event: 'LOGOUT',
          actorUserId: payload.sub,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          safeMeta: { userId: payload.sub, sessionId: session.id },
        });
      }
    } catch {
      // Keep logout idempotent and non-disclosing for invalid/expired/revoked tokens.
    }

    return { success: true };
  }

  async logoutAll(currentUser: AuthUser, meta?: RequestMeta) {
    await this.sessionService.revokeAllUserSessions({
      userId: currentUser.id,
      reason: 'LOGOUT_ALL',
    });
    await this.authAuditService.logEvent({
      event: 'LOGOUT_ALL',
      actorUserId: currentUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: currentUser.id, sessionId: currentUser.sessionId },
    });

    return { success: true };
  }

  private async issueSessionAndTokens(params: {
    user: SafeUserResponse;
    meta?: RequestMeta;
  }) {
    const session = await this.sessionService.createSession({
      userId: params.user.id,
      meta: params.meta,
    });
    const tokens = await this.tokenService.generateTokenPair({
      userId: params.user.id,
      email: params.user.email,
      roles: params.user.roles,
      sessionId: session.id,
    });
    await this.sessionService.setRefreshToken(
      session.id,
      tokens.refreshToken,
      this.tokenService.getRefreshExpiryDate(),
    );
    return tokens;
  }
}
