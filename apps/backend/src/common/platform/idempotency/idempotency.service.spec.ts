import { HttpStatus } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  const prisma = {
    idempotencyRecord: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const service = new IdempotencyService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns replay when hash matches', async () => {
    prisma.idempotencyRecord.findUnique.mockResolvedValue({
      id: '1',
      requestHash: 'abc',
      responseBody: { ok: true },
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { result, replay } = await service.execute({
      actorType: 'user',
      actorId: 'user-1',
      action: 'withdrawal.create',
      idempotencyKey: 'key-1',
      requestHash: 'abc',
      handler: async () => ({ ok: false }),
    });
    expect(replay).toBe(true);
    expect(result).toEqual({ ok: true });
  });

  it('throws IDEMPOTENCY_CONFLICT when hash differs', async () => {
    prisma.idempotencyRecord.findUnique.mockResolvedValue({
      id: '1',
      requestHash: 'abc',
      responseBody: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(
      service.execute({
        actorType: 'user',
        actorId: 'user-1',
        action: 'withdrawal.create',
        idempotencyKey: 'key-1',
        requestHash: 'different',
        handler: async () => ({}),
      }),
    ).rejects.toMatchObject({
      getStatus: expect.any(Function),
    });
    try {
      await service.execute({
        actorType: 'user',
        actorId: 'user-1',
        action: 'withdrawal.create',
        idempotencyKey: 'key-1',
        requestHash: 'different',
        handler: async () => ({}),
      });
    } catch (e) {
      expect((e as { getStatus: () => number }).getStatus()).toBe(
        HttpStatus.CONFLICT,
      );
    }
  });
});
