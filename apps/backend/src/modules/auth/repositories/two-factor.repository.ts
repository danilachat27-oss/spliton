import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TwoFactorChallengeStatus,
  TwoFactorMethodStatus,
  TwoFactorMethodType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TwoFactorRepository {
  constructor(private readonly prisma: PrismaService) {}

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findTotpMethodForUser(userId: string) {
    return this.prisma.twoFactorMethod.findUnique({
      where: {
        userId_methodType: {
          userId,
          methodType: TwoFactorMethodType.TOTP,
        },
      },
    });
  }

  upsertPendingTotpMethod(params: {
    userId: string;
    secretCiphertext: string;
    secretIv: string;
    secretTag: string;
    encryptionKeyVersion: number;
  }) {
    return this.prisma.twoFactorMethod.upsert({
      where: {
        userId_methodType: {
          userId: params.userId,
          methodType: TwoFactorMethodType.TOTP,
        },
      },
      create: {
        userId: params.userId,
        methodType: TwoFactorMethodType.TOTP,
        status: TwoFactorMethodStatus.PENDING,
        secretCiphertext: params.secretCiphertext,
        secretIv: params.secretIv,
        secretTag: params.secretTag,
        encryptionKeyVersion: params.encryptionKeyVersion,
      },
      update: {
        status: TwoFactorMethodStatus.PENDING,
        secretCiphertext: params.secretCiphertext,
        secretIv: params.secretIv,
        secretTag: params.secretTag,
        encryptionKeyVersion: params.encryptionKeyVersion,
        confirmedAt: null,
        lastUsedAt: null,
        disabledAt: null,
      },
    });
  }

  markTotpEnabled(methodId: string) {
    const now = new Date();
    return this.prisma.twoFactorMethod.update({
      where: { id: methodId },
      data: {
        status: TwoFactorMethodStatus.ENABLED,
        confirmedAt: now,
        lastUsedAt: now,
        disabledAt: null,
      },
    });
  }

  markTotpDisabled(userId: string) {
    return this.prisma.twoFactorMethod.updateMany({
      where: {
        userId,
        methodType: TwoFactorMethodType.TOTP,
        status: {
          in: [TwoFactorMethodStatus.ENABLED, TwoFactorMethodStatus.PENDING],
        },
      },
      data: {
        status: TwoFactorMethodStatus.DISABLED,
        disabledAt: new Date(),
      },
    });
  }

  touchTotpLastUsed(methodId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.twoFactorMethod.update({
      where: { id: methodId },
      data: { lastUsedAt: new Date() },
    });
  }

  createBackupCodes(
    userId: string,
    hashes: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.twoFactorBackupCode.createMany({
      data: hashes.map((codeHash) => ({
        userId,
        codeHash,
      })),
    });
  }

  listUnusedBackupCodes(userId: string) {
    return this.prisma.twoFactorBackupCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });
  }

  markBackupCodeUsed(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ userId: string }> {
    const db = tx ?? this.prisma;
    return db.twoFactorBackupCode.update({
      where: { id },
      data: { usedAt: new Date() },
      select: { userId: true },
    });
  }

  deleteAllBackupCodesForUser(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.twoFactorBackupCode.deleteMany({ where: { userId } });
  }

  createChallenge(params: {
    userId: string;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
  }) {
    return this.prisma.twoFactorChallenge.create({
      data: {
        userId: params.userId,
        status: TwoFactorChallengeStatus.PENDING,
        attemptsCount: 0,
        expiresAt: params.expiresAt,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  findChallengeById(id: string) {
    return this.prisma.twoFactorChallenge.findUnique({ where: { id } });
  }

  updateChallenge(
    id: string,
    data: Prisma.TwoFactorChallengeUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.twoFactorChallenge.update({
      where: { id },
      data,
    });
  }

  createUserSessionWithRefresh(params: {
    sessionId: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
    device: string;
    tx?: Prisma.TransactionClient;
  }) {
    const db = params.tx ?? this.prisma;
    return db.userSession.create({
      data: {
        id: params.sessionId,
        userId: params.userId,
        refreshTokenHash: params.refreshTokenHash,
        expiresAt: params.expiresAt,
        lastActiveAt: new Date(),
        ip: params.ip,
        userAgent: params.userAgent,
        device: params.device,
      },
    });
  }
}
