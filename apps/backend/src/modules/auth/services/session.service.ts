import { Injectable } from "@nestjs/common";
import { Prisma, UserSession } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";

type SessionMeta = {
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: {
    userId: string;
    meta?: SessionMeta;
  }): Promise<UserSession> {
    return this.prisma.userSession.create({
      data: {
        userId: params.userId,
        refreshTokenHash: null,
        expiresAt: null,
        lastActiveAt: new Date(),
        ip: params.meta?.ip ?? null,
        userAgent: params.meta?.userAgent ?? null,
        device: params.meta?.device ?? params.meta?.userAgent ?? "unknown",
      },
    });
  }

  async setRefreshToken(sessionId: string, refreshToken: string, expiresAt: Date): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  findSessionById(sessionId: string) {
    return this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
  }

  async verifySessionRefreshToken(session: UserSession, refreshToken: string): Promise<boolean> {
    if (!session.refreshTokenHash) return false;
    return bcrypt.compare(refreshToken, session.refreshTokenHash);
  }

  async revokeSession(params: {
    sessionId: string;
    reason: string;
    replacedBySessionId?: string | null;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const db = params.tx ?? this.prisma;
    await db.userSession.update({
      where: { id: params.sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: params.reason,
        replacedBySessionId: params.replacedBySessionId ?? null,
      },
    });
  }

  async revokeAllUserSessions(params: { userId: string; reason: string; excludeSessionId?: string }): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId: params.userId,
        revokedAt: null,
        ...(params.excludeSessionId ? { id: { not: params.excludeSessionId } } : {}),
      },
      data: {
        revokedAt: new Date(),
        revokedReason: params.reason,
      },
    });

    return result.count;
  }

  async rotateSession(params: {
    currentSession: UserSession;
    newSessionId: string;
    refreshToken: string;
    expiresAt: Date;
    meta?: SessionMeta;
  }): Promise<UserSession> {
    return this.prisma.$transaction(async (tx) => {
      const newSession = await tx.userSession.create({
        data: {
          id: params.newSessionId,
          userId: params.currentSession.userId,
          refreshTokenHash: await bcrypt.hash(params.refreshToken, 12),
          expiresAt: params.expiresAt,
          lastActiveAt: new Date(),
          ip: params.meta?.ip ?? params.currentSession.ip ?? null,
          userAgent: params.meta?.userAgent ?? params.currentSession.userAgent ?? null,
          device: params.meta?.device ?? params.meta?.userAgent ?? params.currentSession.device,
        },
      });

      await tx.userSession.update({
        where: { id: params.currentSession.id },
        data: {
          revokedAt: new Date(),
          revokedReason: "ROTATED",
          replacedBySessionId: newSession.id,
        },
      });

      return newSession;
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
      },
    });
  }

  isSessionExpired(session: UserSession): boolean {
    return Boolean(session.expiresAt && session.expiresAt.getTime() <= Date.now());
  }

  isSessionRevoked(session: UserSession): boolean {
    return Boolean(session.revokedAt);
  }
}
