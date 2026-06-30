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
    const legal = await service.seedLegalCmsUpdateIfMissing();
    const enLocale = await service.seedPublicEnLocalizationUpdateIfMissing();
    const calculator = await service.seedCalculatorUnitsUpdateIfMissing();
    const paymentRequisites = await service.seedPaymentRequisitesUpdateIfMissing();
    console.log(
      `Admin updates seed: legal=${legal}, enLocale=${enLocale}, calculator=${calculator}, paymentRequisites=${paymentRequisites}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
