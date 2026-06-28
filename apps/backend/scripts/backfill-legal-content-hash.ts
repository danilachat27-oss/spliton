/**
 * Idempotent backfill for legal_policies.content_hash (null rows only).
 * Usage: node --env-file=.env npx tsx apps/backend/scripts/backfill-legal-content-hash.ts
 */
import { PrismaClient } from '@prisma/client';
import { computeLegalPolicyContentHash } from '../src/modules/legal/legal-content-hash.util';

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.legalPolicy.findMany({ where: { contentHash: null } });
    let updated = 0;
    for (const row of rows) {
      const contentHash = computeLegalPolicyContentHash({
        type: row.type,
        version: row.version,
        contentFormat: row.contentFormat,
        content: row.content,
      });
      await prisma.legalPolicy.update({
        where: { id: row.id },
        data: { contentHash },
      });
      updated += 1;
    }
    console.log(`Backfilled content_hash for ${updated} legal policies.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
