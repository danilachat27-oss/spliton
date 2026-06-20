import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../errors/error-codes';
import { throwAppError } from '../errors/throw-app-error';

export type IdempotencyActorType = 'user' | 'admin' | 'system';

export type IdempotencyExecuteParams<T> = {
  actorType: IdempotencyActorType;
  actorId: string;
  action: string;
  idempotencyKey: string;
  requestHash: string;
  ttlHours?: number;
  handler: () => Promise<T>;
};

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(params: IdempotencyExecuteParams<T>): Promise<{
    result: T;
    replay: boolean;
  }> {
    const key = params.idempotencyKey.trim();
    if (!key) {
      return { result: await params.handler(), replay: false };
    }

    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        actorType_actorId_action_idempotencyKey: {
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          idempotencyKey: key,
        },
      },
    });

    if (existing) {
      if (existing.requestHash !== params.requestHash) {
        throwAppError(
          ErrorCodes.IDEMPOTENCY_CONFLICT,
          'Idempotency key was already used with a different request body',
          HttpStatus.CONFLICT,
        );
      }
      if (existing.expiresAt.getTime() < Date.now()) {
        await this.prisma.idempotencyRecord.delete({ where: { id: existing.id } });
      } else if (existing.responseBody !== null && existing.responseBody !== undefined) {
        return {
          result: existing.responseBody as T,
          replay: true,
        };
      }
    }

    const result = await params.handler();
    const expiresAt = new Date(
      Date.now() + (params.ttlHours ?? 24) * 60 * 60 * 1000,
    );

    await this.prisma.idempotencyRecord.upsert({
      where: {
        actorType_actorId_action_idempotencyKey: {
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          idempotencyKey: key,
        },
      },
      create: {
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        idempotencyKey: key,
        requestHash: params.requestHash,
        responseBody: result as Prisma.InputJsonValue,
        expiresAt,
      },
      update: {
        requestHash: params.requestHash,
        responseBody: result as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return { result, replay: false };
  }

  async purgeExpired(limit = 500): Promise<number> {
    const rows = await this.prisma.idempotencyRecord.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true },
      take: limit,
    });
    if (rows.length === 0) return 0;
    await this.prisma.idempotencyRecord.deleteMany({
      where: { id: { in: rows.map((r) => r.id) } },
    });
    return rows.length;
  }
}
