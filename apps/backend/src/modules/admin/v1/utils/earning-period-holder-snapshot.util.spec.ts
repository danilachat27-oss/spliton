import { OwnershipEventType, Prisma } from '@prisma/client';
import {
  computeEligibleHoldersAtCutoff,
  earningPeriodCutoffAt,
} from './earning-period-holder-snapshot.util';

describe('earningPeriodHolderSnapshot', () => {
  it('computes holdings from ownership-changing events only', async () => {
    const cutoff = earningPeriodCutoffAt(new Date('2026-01-31'));
    const findMany = jest.fn().mockResolvedValue([
      {
        userId: 'user-a',
        unitsDelta: new Prisma.Decimal(10),
      },
      {
        userId: 'user-a',
        unitsDelta: new Prisma.Decimal(-4),
      },
      {
        userId: 'user-b',
        unitsDelta: new Prisma.Decimal(4),
      },
    ]);

    const client = {
      ownershipLedger: { findMany },
    } as never;

    const holders = await computeEligibleHoldersAtCutoff(
      client,
      'release-1',
      cutoff,
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          releaseId: 'release-1',
          happenedAt: { lte: cutoff },
          eventType: {
            in: [
              OwnershipEventType.PRIMARY_BUY,
              OwnershipEventType.SECONDARY_BUY,
              OwnershipEventType.SECONDARY_SELL,
              OwnershipEventType.LEGACY_POSITION_BACKFILL,
            ],
          },
        }),
      }),
    );
    expect(holders).toEqual([
      { userId: 'user-a', eligibleUnits: new Prisma.Decimal(6) },
      { userId: 'user-b', eligibleUnits: new Prisma.Decimal(4) },
    ]);
  });

  it('uses end of UTC day as cutoff', () => {
    const cutoff = earningPeriodCutoffAt(new Date('2026-01-31T00:00:00.000Z'));
    expect(cutoff.toISOString()).toBe('2026-01-31T23:59:59.999Z');
  });
});
