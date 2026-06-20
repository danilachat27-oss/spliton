import { OwnershipEventType, Prisma } from '@prisma/client';
import type { PrismaService } from '../../../../prisma/prisma.service';

const OWNERSHIP_CHANGE_EVENTS: OwnershipEventType[] = [
  OwnershipEventType.PRIMARY_BUY,
  OwnershipEventType.SECONDARY_BUY,
  OwnershipEventType.SECONDARY_SELL,
  OwnershipEventType.LEGACY_POSITION_BACKFILL,
];

export function earningPeriodCutoffAt(periodEnd: Date): Date {
  const cutoff = new Date(periodEnd);
  cutoff.setUTCHours(23, 59, 59, 999);
  return cutoff;
}

export type EligibleHolderAtCutoff = {
  userId: string;
  eligibleUnits: Prisma.Decimal;
};

export async function computeEligibleHoldersAtCutoff(
  client: Prisma.TransactionClient | PrismaService,
  releaseId: string,
  cutoffAt: Date,
): Promise<EligibleHolderAtCutoff[]> {
  const events = await client.ownershipLedger.findMany({
    where: {
      releaseId,
      happenedAt: { lte: cutoffAt },
      eventType: { in: OWNERSHIP_CHANGE_EVENTS },
    },
    select: { userId: true, unitsDelta: true },
  });

  const byUser = new Map<string, Prisma.Decimal>();
  for (const event of events) {
    const current = byUser.get(event.userId) ?? new Prisma.Decimal(0);
    byUser.set(event.userId, current.plus(event.unitsDelta));
  }

  return [...byUser.entries()]
    .filter(([, units]) => units.greaterThan(0))
    .map(([userId, eligibleUnits]) => ({ userId, eligibleUnits }));
}

export async function loadSnapshotHolders(
  client: Prisma.TransactionClient | PrismaService,
  earningPeriodId: string,
): Promise<EligibleHolderAtCutoff[] | null> {
  const rows = await client.earningPeriodHolderSnapshot.findMany({
    where: { earningPeriodId },
    select: { userId: true, eligibleUnits: true },
  });
  if (rows.length === 0) return null;
  return rows.map((r) => ({
    userId: r.userId,
    eligibleUnits: r.eligibleUnits,
  }));
}

export async function resolveDistributionHolders(
  client: Prisma.TransactionClient | PrismaService,
  period: { id: string; releaseId: string; periodEnd: Date },
): Promise<{ holders: EligibleHolderAtCutoff[]; cutoffAt: Date; source: string }> {
  const cutoffAt = earningPeriodCutoffAt(period.periodEnd);
  const frozen = await loadSnapshotHolders(client, period.id);
  if (frozen) {
    return { holders: frozen, cutoffAt, source: 'EARNING_PERIOD_HOLDER_SNAPSHOT' };
  }
  const holders = await computeEligibleHoldersAtCutoff(
    client,
    period.releaseId,
    cutoffAt,
  );
  return { holders, cutoffAt, source: 'OWNERSHIP_LEDGER_CUTOFF' };
}

export async function persistHolderSnapshots(
  tx: Prisma.TransactionClient,
  period: { id: string; releaseId: string; periodEnd: Date },
  source: string,
) {
  const existing = await tx.earningPeriodHolderSnapshot.count({
    where: { earningPeriodId: period.id },
  });
  if (existing > 0) return;

  const cutoffAt = earningPeriodCutoffAt(period.periodEnd);
  const holders = await computeEligibleHoldersAtCutoff(
    tx,
    period.releaseId,
    cutoffAt,
  );
  if (holders.length === 0) return;

  await tx.earningPeriodHolderSnapshot.createMany({
    data: holders.map((h) => ({
      earningPeriodId: period.id,
      userId: h.userId,
      releaseId: period.releaseId,
      eligibleUnits: h.eligibleUnits,
      cutoffAt,
      source,
    })),
    skipDuplicates: true,
  });
}
