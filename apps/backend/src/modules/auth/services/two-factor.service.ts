import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  TwoFactorChallengeStatus,
  TwoFactorMethodStatus,
} from '@prisma/client';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { TwoFactorRepository } from '../repositories/two-factor.repository';
import type { AuthResponse } from '../types/auth-response.type';
import type {
  TwoFactorSetupResponse,
  TwoFactorVerifyMethod,
  TwoFactorVerifySetupResponse,
} from '../types/two-factor.types';
import { AuthAuditService } from './auth-audit.service';
import { TwoFactorBackupCodeService } from './two-factor-backup-code.service';
import { TwoFactorEncryptionService } from './two-factor-encryption.service';
import { TwoFactorLoginCompletionService } from './two-factor-login-completion.service';
import { TokenService } from './token.service';

const TOTP_PERIOD_SEC = 30;
/** ±1 step (30s) drift tolerance, aligned with previous `window: 1`. */
const TOTP_EPOCH_TOLERANCE_SEC = TOTP_PERIOD_SEC;

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const ISSUER = 'Spliton';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly repo: TwoFactorRepository,
    private readonly encryption: TwoFactorEncryptionService,
    private readonly backupCodes: TwoFactorBackupCodeService,
    private readonly tokenService: TokenService,
    private readonly authAudit: AuthAuditService,
    private readonly loginCompletion: TwoFactorLoginCompletionService,
  ) {}

  async isTotpEnabledForUser(userId: string): Promise<boolean> {
    const row = await this.repo.findTotpMethodForUser(userId);
    return Boolean(row?.status === TwoFactorMethodStatus.ENABLED);
  }

  async setup(
    userId: string,
    email: string,
    meta?: RequestMeta,
  ): Promise<TwoFactorSetupResponse> {
    this.encryption.assertEncryptionConfigured();
    const existing = await this.repo.findTotpMethodForUser(userId);
    if (existing?.status === TwoFactorMethodStatus.ENABLED) {
      throw new ConflictException(
        'Two-factor authentication is already enabled',
      );
    }

    const secret = generateSecret();
    const enc = this.encryption.encryptSecret(secret);
    const method = await this.repo.upsertPendingTotpMethod({
      userId,
      secretCiphertext: enc.ciphertextB64,
      secretIv: enc.ivB64,
      secretTag: enc.tagB64,
      encryptionKeyVersion: enc.encryptionKeyVersion,
    });

    const otpauthUrl = generateURI({
      issuer: ISSUER,
      label: email,
      secret,
      period: TOTP_PERIOD_SEC,
    });

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_SETUP_STARTED',
      actorUserId: userId,
      entityId: method.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, methodId: method.id },
    });

    return { methodId: method.id, otpauthUrl };
  }

  async verifySetup(
    userId: string,
    code: string,
    meta?: RequestMeta,
  ): Promise<TwoFactorVerifySetupResponse> {
    this.encryption.assertEncryptionConfigured();
    const method = await this.repo.findTotpMethodForUser(userId);
    if (!method || method.status !== TwoFactorMethodStatus.PENDING) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const secret = this.encryption.decryptSecret({
      ciphertextB64: method.secretCiphertext,
      ivB64: method.secretIv,
      tagB64: method.secretTag,
    });

    const ok = verifySync({
      secret,
      token: code.trim(),
      period: TOTP_PERIOD_SEC,
      epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
    }).valid;
    if (!ok) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.repo.markTotpEnabled(method.id);
    await this.repo.deleteAllBackupCodesForUser(userId);
    const plaintext = this.backupCodes.generatePlaintextCodes();
    const hashes = await Promise.all(
      plaintext.map((p) => this.backupCodes.hashCode(p)),
    );
    await this.repo.createBackupCodes(userId, hashes);

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_ENABLED',
      actorUserId: userId,
      entityId: method.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, methodId: method.id },
    });
    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_RECOVERY_CODES_REGENERATED',
      actorUserId: userId,
      entityId: userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, reason: 'INITIAL_SETUP' },
    });

    return { enabled: true, backupCodes: plaintext };
  }

  async createLoginChallenge(
    userId: string,
    meta?: RequestMeta,
  ): Promise<string> {
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const row = await this.repo.createChallenge({
      userId,
      expiresAt,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    });

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_CHALLENGE_CREATED',
      actorUserId: userId,
      entityId: row.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, challengeId: row.id },
    });

    return row.id;
  }

  async verifyChallengeAndLogin(params: {
    challengeId: string;
    code: string;
    method: TwoFactorVerifyMethod;
    meta?: RequestMeta;
  }): Promise<AuthResponse> {
    const challenge = await this.repo.findChallengeById(params.challengeId);
    if (!challenge) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (challenge.status !== TwoFactorChallengeStatus.PENDING) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await this.repo.updateChallenge(challenge.id, {
        status: TwoFactorChallengeStatus.EXPIRED,
      });
      await this.authAudit.logEvent({
        event: 'TWO_FACTOR_CHALLENGE_FAILED',
        actorUserId: challenge.userId,
        entityId: challenge.id,
        ip: params.meta?.ip,
        userAgent: params.meta?.userAgent,
        safeMeta: { challengeId: challenge.id, reason: 'EXPIRED' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (challenge.attemptsCount >= MAX_CHALLENGE_ATTEMPTS) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const methodRow = await this.repo.findTotpMethodForUser(challenge.userId);
    if (!methodRow || methodRow.status !== TwoFactorMethodStatus.ENABLED) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let valid = false;
    let backupRowId: string | null = null;

    if (params.method === 'totp') {
      const secret = this.encryption.decryptSecret({
        ciphertextB64: methodRow.secretCiphertext,
        ivB64: methodRow.secretIv,
        tagB64: methodRow.secretTag,
      });
      valid = verifySync({
        secret,
        token: params.code.trim(),
        period: TOTP_PERIOD_SEC,
        epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
      }).valid;
    } else {
      const unused = await this.repo.listUnusedBackupCodes(challenge.userId);
      const matchId = await this.backupCodes.findMatchingUnusedHashId(
        params.code,
        unused,
      );
      if (matchId) {
        valid = true;
        backupRowId = matchId;
      }
    }

    if (!valid) {
      const next = challenge.attemptsCount + 1;
      const failed = next >= MAX_CHALLENGE_ATTEMPTS;
      await this.repo.updateChallenge(challenge.id, {
        attemptsCount: next,
        ...(failed ? { status: TwoFactorChallengeStatus.FAILED } : {}),
      });
      await this.authAudit.logEvent({
        event: 'TWO_FACTOR_CHALLENGE_FAILED',
        actorUserId: challenge.userId,
        entityId: challenge.id,
        ip: params.meta?.ip,
        userAgent: params.meta?.userAgent,
        safeMeta: {
          challengeId: challenge.id,
          reason: 'INVALID_CODE',
          attempts: next,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.loginCompletion.getUserForTwoFactor(
      challenge.userId,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = randomUUID();
    const tokens = await this.tokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      sessionId,
    });
    const refreshExpiry = this.tokenService.getRefreshExpiryDate();
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 12);
    const device = params.meta?.device ?? params.meta?.userAgent ?? 'unknown';

    await this.repo.runTransaction(async (tx) => {
      await this.repo.updateChallenge(
        challenge.id,
        {
          status: TwoFactorChallengeStatus.VERIFIED,
          consumedAt: new Date(),
        },
        tx,
      );
      if (backupRowId) {
        await this.repo.markBackupCodeUsed(backupRowId, tx);
      } else {
        await this.repo.touchTotpLastUsed(methodRow.id, tx);
      }
      await this.repo.createUserSessionWithRefresh({
        sessionId,
        userId: challenge.userId,
        refreshTokenHash: refreshHash,
        expiresAt: refreshExpiry,
        ip: params.meta?.ip ?? null,
        userAgent: params.meta?.userAgent ?? null,
        device,
        tx,
      });
    });

    if (backupRowId) {
      await this.authAudit.logEvent({
        event: 'TWO_FACTOR_BACKUP_CODE_USED',
        actorUserId: challenge.userId,
        entityId: backupRowId,
        ip: params.meta?.ip,
        userAgent: params.meta?.userAgent,
        safeMeta: { userId: challenge.userId, challengeId: challenge.id },
      });
    }

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_CHALLENGE_SUCCESS',
      actorUserId: challenge.userId,
      entityId: challenge.id,
      ip: params.meta?.ip,
      userAgent: params.meta?.userAgent,
      safeMeta: { userId: challenge.userId, challengeId: challenge.id },
    });

    return this.loginCompletion.finalizeTwoFactorLogin(
      challenge.userId,
      tokens,
      params.meta,
    );
  }

  async disable(
    userId: string,
    password: string,
    code: string,
    method: TwoFactorVerifyMethod,
    passwordHash: string | null,
    meta?: RequestMeta,
  ): Promise<{ success: true }> {
    if (!passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const pwdOk = await bcrypt.compare(password, passwordHash);
    if (!pwdOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const methodRow = await this.repo.findTotpMethodForUser(userId);
    if (!methodRow || methodRow.status !== TwoFactorMethodStatus.ENABLED) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let secondOk = false;
    if (method === 'totp') {
      const secret = this.encryption.decryptSecret({
        ciphertextB64: methodRow.secretCiphertext,
        ivB64: methodRow.secretIv,
        tagB64: methodRow.secretTag,
      });
      secondOk = verifySync({
        secret,
        token: code.trim(),
        period: TOTP_PERIOD_SEC,
        epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
      }).valid;
    } else {
      const unused = await this.repo.listUnusedBackupCodes(userId);
      const matchId = await this.backupCodes.findMatchingUnusedHashId(
        code,
        unused,
      );
      secondOk = Boolean(matchId);
      if (matchId) {
        await this.repo.markBackupCodeUsed(matchId);
        await this.authAudit.logEvent({
          event: 'TWO_FACTOR_BACKUP_CODE_USED',
          actorUserId: userId,
          entityId: matchId,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          safeMeta: { userId, reason: 'DISABLE_2FA' },
        });
      }
    }

    if (!secondOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.repo.markTotpDisabled(userId);
    await this.repo.deleteAllBackupCodesForUser(userId);

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_DISABLED',
      actorUserId: userId,
      entityId: userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId },
    });

    return { success: true };
  }

  async regenerateRecoveryCodes(
    userId: string,
    code: string,
    meta?: RequestMeta,
  ): Promise<{ backupCodes: string[] }> {
    const methodRow = await this.repo.findTotpMethodForUser(userId);
    if (!methodRow || methodRow.status !== TwoFactorMethodStatus.ENABLED) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const secret = this.encryption.decryptSecret({
      ciphertextB64: methodRow.secretCiphertext,
      ivB64: methodRow.secretIv,
      tagB64: methodRow.secretTag,
    });
    const ok = verifySync({
      secret,
      token: code.trim(),
      period: TOTP_PERIOD_SEC,
      epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
    }).valid;
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.repo.deleteAllBackupCodesForUser(userId);
    const plaintext = this.backupCodes.generatePlaintextCodes();
    const hashes = await Promise.all(
      plaintext.map((p) => this.backupCodes.hashCode(p)),
    );
    await this.repo.createBackupCodes(userId, hashes);

    await this.authAudit.logEvent({
      event: 'TWO_FACTOR_RECOVERY_CODES_REGENERATED',
      actorUserId: userId,
      entityId: userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId, reason: 'REGENERATE' },
    });

    return { backupCodes: plaintext };
  }
}
