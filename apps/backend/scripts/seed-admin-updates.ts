/**
 * Idempotent seed for admin product updates.
 * Usage: npx tsx apps/backend/scripts/seed-admin-updates.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { AdminUpdatesService } from '../src/modules/admin-updates/admin-updates.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const prisma = new PrismaClient();
  const service = new AdminUpdatesService(prisma as unknown as PrismaService);
  try {
    const result = await service.seedLegalCmsUpdateIfMissing();
    console.log(`Admin updates seed: ${result}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
