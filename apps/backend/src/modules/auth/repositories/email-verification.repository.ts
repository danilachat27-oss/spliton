import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmailVerificationRepository {
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
    return db.emailVerificationToken.create({
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
    return db.emailVerificationToken.updateMany({
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
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  markTokenUsed(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  activateUser(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
