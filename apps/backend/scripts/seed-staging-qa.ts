/**
 * Idempotent staging QA seed — run once after migrate deploy on staging DB.
 *
 * Usage (from repo root, with staging DATABASE_URL in .env):
 *   npx tsx apps/backend/scripts/seed-staging-qa.ts
 *
 * Optional: STAGING_QA_PASSWORD overrides default test password (never commit real value).
 */
import * as bcrypt from 'bcrypt';
import {
  ListingStatus,
  OwnershipEventType,
  Prisma,
  PrismaClient,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  UserRoleCode,
  UserStatus,
  WalletStatus,
  LedgerAccount,
  LedgerOperationType,
  LedgerPostingSide,
  ActorRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const RELEASE_SLUG = 'spliton-staging-qa-release';
const RELEASE_SYMBOL = 'SPLSTGQA';

const INVESTOR_EMAIL = 'staging.qa.investor@spliton.test';
const SELLER_EMAIL = 'staging.qa.seller@spliton.test';
const SUPPORT_EMAIL = 'staging.qa.support@spliton.test';
const SUPER_ADMIN_EMAIL = 'staging.qa.superadmin@spliton.test';
const ANALYST_EMAIL = 'staging.qa.analyst@spliton.test';
const FINANCE_EMAIL = 'staging.qa.finance@spliton.test';
const COMPLIANCE_EMAIL = 'staging.qa.compliance@spliton.test';

const DEFAULT_PASSWORD = process.env.STAGING_QA_PASSWORD ?? 'StagingQa2026!';

const INVESTOR_BALANCE = '500';
const SELLER_BALANCE = '50';
const LISTING_UNITS = '5';
const LISTING_PRICE = '12';
const INVESTOR_HOLDING_UNITS = '20';

async function upsertActiveUser(email: string, displayName: string) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const normalized = email.toLowerCase().trim();

  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: {
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      email: normalized,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      profile: { create: { displayName } },
    },
    include: { profile: true },
  });

  if (!user.profile) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, displayName },
      update: { displayName },
    });
  }

  const investorRole = await prisma.role.findUnique({ where: { code: UserRoleCode.INVESTOR } });
  if (investorRole) {
    await prisma.userRole.createMany({
      data: [{ userId: user.id, roleId: investorRole.id }],
      skipDuplicates: true,
    });
  }

  return user;
}

async function grantStaffRole(email: string, roleCode: UserRoleCode) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!role || !user) return;
  await prisma.userRole.createMany({
    data: [{ userId: user.id, roleId: role.id }],
    skipDuplicates: true,
  });
}

async function ensureWallet(userId: string, available: string, locked = '0') {
  const existing = await prisma.wallet.findFirst({
    where: { userId, assetCode: 'USDT', network: 'TRC20' },
    include: { balance: true },
  });

  if (existing?.balance) {
    await prisma.walletBalance.update({
      where: { walletId: existing.id },
      data: {
        available: new Prisma.Decimal(available),
        locked: new Prisma.Decimal(locked),
      },
    });
    return existing;
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId,
      assetCode: 'USDT',
      network: 'TRC20',
      status: WalletStatus.ACTIVE,
      balance: {
        create: {
          available: new Prisma.Decimal(available),
          locked: new Prisma.Decimal(locked),
          pending: new Prisma.Decimal(0),
        },
      },
    },
  });

  const avail = new Prisma.Decimal(available);
  if (avail.greaterThan(0)) {
    await prisma.ledgerPosting.create({
      data: {
        walletId: wallet.id,
        ledgerAccount: LedgerAccount.USER_AVAILABLE,
        side: LedgerPostingSide.CREDIT,
        amount: avail,
        currency: 'USDT',
        operationType: LedgerOperationType.OPENING_BALANCE,
        sourceEntityType: 'staging_qa_seed',
        sourceEntityId: wallet.id,
        actorRole: ActorRole.SYSTEM,
      },
    });
  }

  return wallet;
}

async function ensureRelease() {
  const totalUnits = 1000;
  const soldUnits = 120;
  const available = totalUnits - soldUnits;
  const unitPrice = 15;

  const artist = await prisma.artist.upsert({
    where: { slug: 'spliton-staging-qa-artist' },
    update: { name: 'Staging QA Artist' },
    create: { slug: 'spliton-staging-qa-artist', name: 'Staging QA Artist' },
  });

  const release = await prisma.release.upsert({
    where: { slug: RELEASE_SLUG },
    update: {
      title: 'Staging QA Release',
      genre: 'Electronic',
      segment: 'Electronic',
      status: ReleaseStatus.ACTIVE,
      primaryUnitPrice: unitPrice,
      unitsAvailablePrimary: available,
      secondaryEnabled: true,
      shortDescription: 'Staging QA — live primary round for manual/automated purchase smoke.',
    },
    create: {
      slug: RELEASE_SLUG,
      symbol: RELEASE_SYMBOL,
      title: 'Staging QA Release',
      genre: 'Electronic',
      segment: 'Electronic',
      payoutFrequency: 'MONTHLY',
      totalUnits,
      unitsAvailablePrimary: available,
      primaryUnitPrice: unitPrice,
      raiseTargetUsdt: unitPrice * totalUnits,
      hardCapUsdt: unitPrice * totalUnits * 1.2,
      status: ReleaseStatus.ACTIVE,
      secondaryEnabled: true,
      shortDescription: 'Staging QA — live primary round for manual/automated purchase smoke.',
      releaseArtists: { create: { artistId: artist.id, role: 'MAIN' } },
    },
  });

  await prisma.primaryRaiseRound.deleteMany({ where: { releaseId: release.id } });
  await prisma.primaryRaiseRound.create({
    data: {
      releaseId: release.id,
      status: PrimaryRaiseRoundStatus.LIVE,
      raiseTargetUsdt: unitPrice * totalUnits,
      hardCapUsdt: unitPrice * totalUnits * 1.2,
      totalUnits,
      soldUnits,
    },
  });

  await prisma.releaseMetricsDaily.deleteMany({ where: { releaseId: release.id } });
  await prisma.releaseMetricsDaily.create({
    data: {
      releaseId: release.id,
      asOfDate: new Date(),
      yieldPct: 9.5,
      liquidityScore: 0.6,
      volume24hNotional: 800,
    },
  });

  return release;
}

async function ensurePrimaryBuyLedger(
  userId: string,
  releaseId: string,
  units: string,
  avgEntry: string,
) {
  const existing = await prisma.ownershipLedger.findFirst({
    where: {
      userId,
      releaseId,
      eventType: OwnershipEventType.PRIMARY_BUY,
    },
  });
  if (existing) return existing;

  return prisma.ownershipLedger.create({
    data: {
      userId,
      releaseId,
      eventType: OwnershipEventType.PRIMARY_BUY,
      unitsDelta: new Prisma.Decimal(units),
      pricePerUnit: new Prisma.Decimal(avgEntry),
      happenedAt: new Date('2025-06-01T12:00:00.000Z'),
    },
  });
}

async function ensurePosition(userId: string, releaseId: string, units: string, avgEntry: string) {
  const position = await prisma.userPosition.upsert({
    where: { userId_releaseId: { userId, releaseId } },
    update: {
      unitsTotal: new Prisma.Decimal(units),
      unitsAvailable: new Prisma.Decimal(units),
      unitsLocked: new Prisma.Decimal(0),
      avgEntryPrice: new Prisma.Decimal(avgEntry),
    },
    create: {
      userId,
      releaseId,
      unitsTotal: new Prisma.Decimal(units),
      unitsAvailable: new Prisma.Decimal(units),
      unitsLocked: new Prisma.Decimal(0),
      avgEntryPrice: new Prisma.Decimal(avgEntry),
    },
  });
  await ensurePrimaryBuyLedger(userId, releaseId, units, avgEntry);
  return position;
}

async function ensureSellerListing(sellerId: string, releaseId: string) {
  const existing = await prisma.marketListing.findFirst({
    where: {
      sellerUserId: sellerId,
      releaseId,
      status: ListingStatus.ACTIVE,
      deletedAt: null,
    },
  });
  if (existing) return existing;

  const position = await prisma.userPosition.findUnique({
    where: { userId_releaseId: { userId: sellerId, releaseId } },
  });
  if (!position) throw new Error('Seller position missing before listing seed');

  const units = new Prisma.Decimal(LISTING_UNITS);
  await prisma.userPosition.update({
    where: { userId_releaseId: { userId: sellerId, releaseId } },
    data: {
      unitsLocked: { increment: units },
      unitsAvailable: { decrement: units },
    },
  });

  return prisma.marketListing.create({
    data: {
      releaseId,
      sellerUserId: sellerId,
      pricePerUnit: new Prisma.Decimal(LISTING_PRICE),
      unitsTotal: units,
      unitsAvailable: units,
      status: ListingStatus.ACTIVE,
    },
  });
}

async function main() {
  console.log('Spliton staging QA seed (idempotent)…');

  const investor = await upsertActiveUser(INVESTOR_EMAIL, 'Staging QA Investor');
  const seller = await upsertActiveUser(SELLER_EMAIL, 'Staging QA Seller');
  await upsertActiveUser(SUPPORT_EMAIL, 'Staging QA Support');
  await upsertActiveUser(SUPER_ADMIN_EMAIL, 'Staging QA Super Admin');
  await upsertActiveUser(ANALYST_EMAIL, 'Staging QA Analyst');
  await upsertActiveUser(FINANCE_EMAIL, 'Staging QA Finance');
  await upsertActiveUser(COMPLIANCE_EMAIL, 'Staging QA Compliance');
  await grantStaffRole(SUPPORT_EMAIL, UserRoleCode.SUPPORT_MANAGER);
  await grantStaffRole(SUPER_ADMIN_EMAIL, UserRoleCode.SUPER_ADMIN);
  await grantStaffRole(ANALYST_EMAIL, UserRoleCode.BUSINESS_ANALYST);
  await grantStaffRole(FINANCE_EMAIL, UserRoleCode.ACCOUNTANT);
  await grantStaffRole(COMPLIANCE_EMAIL, UserRoleCode.COMPLIANCE);

  await ensureWallet(investor.id, INVESTOR_BALANCE);
  await ensureWallet(seller.id, SELLER_BALANCE);

  const release = await ensureRelease();

  await ensurePosition(investor.id, release.id, INVESTOR_HOLDING_UNITS, '14');
  await ensurePosition(seller.id, release.id, '30', '14');

  const listing = await ensureSellerListing(seller.id, release.id);

  console.log('');
  console.log('--- Staging QA entities ---');
  console.log(`Release id:    ${release.id}`);
  console.log(`Release slug:  ${RELEASE_SLUG}`);
  console.log(`Investor:      ${INVESTOR_EMAIL}`);
  console.log(`Seller:        ${SELLER_EMAIL}`);
  console.log(`Support staff: ${SUPPORT_EMAIL}`);
  console.log(`Super admin:   ${SUPER_ADMIN_EMAIL}`);
  console.log(`Analyst:       ${ANALYST_EMAIL}`);
  console.log(`Finance:       ${FINANCE_EMAIL}`);
  console.log(`Compliance:    ${COMPLIANCE_EMAIL}`);
  console.log(`Listing id:    ${listing.id}`);
  console.log(`Password:      set via STAGING_QA_PASSWORD or default documented in docs/staging/STAGING_SEED.md`);
  console.log('');
  console.log('Playwright env:');
  console.log(`  PLAYWRIGHT_BUY_RELEASE_ID=${release.id}`);
  console.log(`  PLAYWRIGHT_TEST_USER_EMAIL=${INVESTOR_EMAIL}`);
  console.log(`  PLAYWRIGHT_TEST_USER2_EMAIL=${SELLER_EMAIL}`);
  console.log(`  PLAYWRIGHT_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}`);
  console.log('  PLAYWRIGHT_TEST_USER_PASSWORD=<STAGING_QA_PASSWORD>');
  console.log('  PLAYWRIGHT_ADMIN_PASSWORD=<STAGING_QA_PASSWORD>');
  console.log('  PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1  # optional — mutates balance');
}

main()
  .catch((err) => {
    console.error('Staging QA seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
