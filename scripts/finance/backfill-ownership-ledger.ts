/**
 * Idempotent ownership ledger backfill for legacy UserPosition rows without events.
 *
 * Usage (repo root, DATABASE_URL / DIRECT_URL in .env):
 *   npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run
 *   npx tsx scripts/finance/backfill-ownership-ledger.ts --apply [--batch-id=<uuid>] [--exclude-email-pattern=@example.com]
 *
 * Rollback (emergency, by batch only):
 *   DELETE FROM ownership_ledger WHERE event_type = 'LEGACY_POSITION_BACKFILL' AND backfill_batch_id = '<batch-id>';
 */
import { randomUUID } from 'node:crypto';
import { OwnershipEventType, Prisma, PrismaClient } from '@prisma/client';

const BACKFILL_SOURCE = 'legacy-position-backfill-script-v1';

const prisma = new PrismaClient();

const OWNERSHIP_CHANGE_EVENTS: OwnershipEventType[] = [
  OwnershipEventType.PRIMARY_BUY,
  OwnershipEventType.SECONDARY_BUY,
  OwnershipEventType.SECONDARY_SELL,
  OwnershipEventType.LEGACY_POSITION_BACKFILL,
];

type LedgerClient = Pick<PrismaClient, 'ownershipLedger'>;

type BackfillCandidate = {
  userId: string;
  releaseId: string;
  userEmail: string;
  releaseSlug: string;
  positionUnits: Prisma.Decimal;
  ledgerUnits: Prisma.Decimal;
  missingUnits: Prisma.Decimal;
  happenedAt: Date;
  hasExistingBackfill: boolean;
};

async function ledgerUnitsFor(
  client: LedgerClient,
  userId: string,
  releaseId: string,
): Promise<Prisma.Decimal> {
  const events = await client.ownershipLedger.findMany({
    where: {
      userId,
      releaseId,
      eventType: { in: OWNERSHIP_CHANGE_EVENTS },
    },
    select: { unitsDelta: true },
  });
  return events.reduce(
    (sum, e) => sum.plus(e.unitsDelta),
    new Prisma.Decimal(0),
  );
}

async function resolveHappenedAt(
  releaseId: string,
  positionCreatedAt: Date,
): Promise<Date> {
  const firstPeriod = await prisma.earningPeriod.findFirst({
    where: { releaseId },
    orderBy: { periodStart: 'asc' },
    select: { periodStart: true },
  });
  if (firstPeriod) {
    const safe = new Date(firstPeriod.periodStart);
    safe.setUTCDate(safe.getUTCDate() - 1);
    safe.setUTCHours(12, 0, 0, 0);
    return safe < positionCreatedAt ? safe : positionCreatedAt;
  }
  return positionCreatedAt;
}

function parseArgs(argv: string[]) {
  const mode = argv.includes('--apply')
    ? 'apply'
    : argv.includes('--dry-run')
      ? 'dry-run'
      : null;
  const batchIdArg = argv.find((a) => a.startsWith('--batch-id='));
  const excludeArg = argv.find((a) => a.startsWith('--exclude-email-pattern='));
  return {
    mode,
    batchId: batchIdArg?.split('=')[1]?.trim() || null,
    excludeEmailPattern: excludeArg?.split('=')[1]?.trim() || null,
  };
}

async function collectCandidates(
  excludeEmailPattern: string | null,
): Promise<BackfillCandidate[]> {
  const positions = await prisma.userPosition.findMany({
    where: { unitsTotal: { gt: 0 } },
    include: {
      user: { select: { email: true } },
      release: { select: { slug: true } },
    },
  });

  const candidates: BackfillCandidate[] = [];
  for (const pos of positions) {
    if (
      excludeEmailPattern &&
      pos.user.email.toLowerCase().includes(excludeEmailPattern.toLowerCase())
    ) {
      continue;
    }

    const ledgerUnits = await ledgerUnitsFor(prisma, pos.userId, pos.releaseId);
    const missing = pos.unitsTotal.minus(ledgerUnits);
    if (missing.lessThanOrEqualTo(0)) continue;

    const existingBackfill = await prisma.ownershipLedger.findFirst({
      where: {
        userId: pos.userId,
        releaseId: pos.releaseId,
        eventType: OwnershipEventType.LEGACY_POSITION_BACKFILL,
      },
      select: { id: true },
    });

    const happenedAt = await resolveHappenedAt(pos.releaseId, pos.createdAt);

    candidates.push({
      userId: pos.userId,
      releaseId: pos.releaseId,
      userEmail: pos.user.email,
      releaseSlug: pos.release.slug,
      positionUnits: pos.unitsTotal,
      ledgerUnits,
      missingUnits: missing,
      happenedAt,
      hasExistingBackfill: Boolean(existingBackfill),
    });
  }
  return candidates;
}

async function auditEarningPeriods() {
  const periods = await prisma.earningPeriod.findMany({
    where: {
      status: { in: ['APPROVED', 'REVIEW', 'CALCULATED', 'DISTRIBUTED'] },
    },
    select: {
      id: true,
      releaseId: true,
      periodEnd: true,
      status: true,
      holderSnapshots: { select: { id: true }, take: 1 },
    },
  });
  const withoutSnapshots = periods.filter(
    (p) => p.status === 'APPROVED' && p.holderSnapshots.length === 0,
  );
  return { total: periods.length, approvedWithoutSnapshot: withoutSnapshots.length };
}

async function main() {
  const { mode, batchId: batchIdArg, excludeEmailPattern } = parseArgs(
    process.argv.slice(2),
  );
  if (!mode) {
    console.error(
      'Usage: --dry-run | --apply [--batch-id=<uuid>] [--exclude-email-pattern=@example.com]',
    );
    process.exit(1);
  }

  const candidates = await collectCandidates(excludeEmailPattern);
  const users = new Set(candidates.map((c) => c.userId));
  const releases = new Set(candidates.map((c) => c.releaseId));
  const periodAudit = await auditEarningPeriods();
  const e2eExcludedNote = excludeEmailPattern
    ? `exclude-email-pattern=${excludeEmailPattern}`
    : 'no email exclude filter';

  console.log('=== Ownership ledger backfill ===');
  console.log(`Source: ${BACKFILL_SOURCE}`);
  console.log(`Mode: ${mode}`);
  console.log(`Filter: ${e2eExcludedNote}`);
  console.log(`Positions with missing ledger units: ${candidates.length}`);
  console.log(`Affected users: ${users.size}`);
  console.log(`Affected releases: ${releases.size}`);
  console.log(
    `Approved earning periods without holder snapshot: ${periodAudit.approvedWithoutSnapshot} / ${periodAudit.total}`,
  );
  console.log(
    'happenedAt rule: day before earliest EarningPeriod.periodStart (12:00 UTC) or UserPosition.createdAt',
  );

  if (candidates.length === 0) {
    console.log('No missing ownership events. Nothing to do.');
    return;
  }

  const e2eLike = candidates.filter((c) => c.userEmail.endsWith('@example.com'));
  if (e2eLike.length > 0) {
    console.log(
      `\nNote: ${e2eLike.length} candidate(s) are @example.com (e2e). On staging, consider --exclude-email-pattern=@example.com unless cleaning test data.`,
    );
  }

  console.log('\nPlanned events (LEGACY_POSITION_BACKFILL):');
  for (const c of candidates.slice(0, 50)) {
    console.log(
      `  ${c.userEmail} · ${c.releaseSlug} · position=${c.positionUnits} ledger=${c.ledgerUnits} +${c.missingUnits} @ ${c.happenedAt.toISOString()}${c.hasExistingBackfill ? ' (partial — existing backfill row)' : ''}`,
    );
  }
  if (candidates.length > 50) {
    console.log(`  … and ${candidates.length - 50} more`);
  }

  if (mode === 'dry-run') {
    console.log('\nDry-run complete. Review output, then re-run with --apply.');
    return;
  }

  const batchId = batchIdArg || `legacy-backfill-${randomUUID()}`;
  console.log(`\nApply batch id: ${batchId}`);

  let created = 0;
  let skipped = 0;
  await prisma.$transaction(async (tx) => {
    for (const c of candidates) {
      const afterLedger = await ledgerUnitsFor(tx, c.userId, c.releaseId);
      const stillMissing = c.positionUnits.minus(afterLedger);
      if (stillMissing.lessThanOrEqualTo(0)) {
        skipped += 1;
        continue;
      }

      await tx.ownershipLedger.create({
        data: {
          userId: c.userId,
          releaseId: c.releaseId,
          eventType: OwnershipEventType.LEGACY_POSITION_BACKFILL,
          unitsDelta: stillMissing,
          pricePerUnit: new Prisma.Decimal(0),
          backfillBatchId: batchId,
          happenedAt: c.happenedAt,
        },
      });
      created += 1;
    }
  });

  console.log(`\nApply complete.`);
  console.log(`  batchId: ${batchId}`);
  console.log(`  created: ${created}`);
  console.log(`  skipped (already balanced): ${skipped}`);
  console.log(
    `  rollback SQL: DELETE FROM ownership_ledger WHERE event_type = 'LEGACY_POSITION_BACKFILL' AND backfill_batch_id = '${batchId}';`,
  );
}

main()
  .catch((err) => {
    console.error('[backfill] failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
