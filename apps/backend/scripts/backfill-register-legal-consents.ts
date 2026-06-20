/**
 * Idempotent backfill: record REGISTER legal consents for users missing active TERMS/PRIVACY.
 *
 * Usage:
 *   npx ts-node scripts/backfill-register-legal-consents.ts --dry-run
 *   npx ts-node scripts/backfill-register-legal-consents.ts --apply
 */
import { ConsentSource, LegalPolicyStatus, LegalPolicyType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REGISTER_TYPES = [LegalPolicyType.TERMS_OF_SERVICE, LegalPolicyType.PRIVACY_POLICY];

async function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  console.log(`[legal-backfill] mode=${dryRun ? 'dry-run' : 'apply'}`);

  const activePolicies = await Promise.all(
    REGISTER_TYPES.map((type) =>
      prisma.legalPolicy.findFirst({
        where: { type, status: LegalPolicyStatus.ACTIVE },
        orderBy: { publishedAt: 'desc' },
      }),
    ),
  );

  const policies = activePolicies.filter(Boolean);
  if (policies.length === 0) {
    console.log('[legal-backfill] no active REGISTER policies — nothing to do');
    return;
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true },
  });

  let wouldCreate = 0;
  let created = 0;
  let skipped = 0;

  for (const user of users) {
    let userMissing = false;
    for (const policy of policies) {
      if (!policy) continue;
      const existing = await prisma.userLegalConsent.findUnique({
        where: {
          userId_policyType_policyVersion: {
            userId: user.id,
            policyType: policy.type,
            policyVersion: policy.version,
          },
        },
      });
      if (!existing) {
        userMissing = true;
        if (dryRun) {
          wouldCreate += 1;
          console.log(
            `[dry-run] would backfill ${user.email} → ${policy.type} v${policy.version}`,
          );
        } else {
          await prisma.userLegalConsent.create({
            data: {
              userId: user.id,
              policyId: policy.id,
              policyType: policy.type,
              policyVersion: policy.version,
              source: ConsentSource.REGISTER,
              ip: null,
              userAgent: 'backfill-register-legal-consents',
            },
          });
          created += 1;
          console.log(`[apply] backfilled ${user.email} → ${policy.type} v${policy.version}`);
        }
      }
    }
    if (!userMissing) skipped += 1;
  }

  console.log(
    `[legal-backfill] users=${users.length} skippedComplete=${skipped} ` +
      `${dryRun ? `wouldCreate=${wouldCreate}` : `created=${created}`}`,
  );
}

main()
  .catch((err) => {
    console.error('[legal-backfill] failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
