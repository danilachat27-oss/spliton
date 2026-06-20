import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  createToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
    tx?: Prisma.TransactionClient;
  }) {
    const db = params.tx ?? this.prisma;
    return db.passwordResetToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  revokeActiveTokensForUser(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ count: number }> {
    const db = tx ?? this.prisma;
    return db.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  findTokenByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  markTokenUsed(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  updateUserPasswordHash(
    userId: string,
    passwordHash: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
