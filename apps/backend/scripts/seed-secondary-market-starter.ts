/**
 * Secondary market demo seed — active listings + order book snapshots for starter catalog releases.
 * Idempotent — safe to re-run.
 *
 * Prerequisite: catalog starter releases (run seed-catalog-starter.ts first).
 *
 * Usage (from repo root):
 *   npm run prisma:seed:secondary-market
 */
import * as bcrypt from 'bcrypt';
import {
  ListingStatus,
  OwnershipEventType,
  Prisma,
  PrismaClient,
  UserRoleCode,
  UserStatus,
  WalletStatus,
  LedgerAccount,
  LedgerOperationType,
  LedgerPostingSide,
  ActorRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const SELLER1_EMAIL = 'secondary.demo.seller1@spliton.test';
const SELLER2_EMAIL = 'secondary.demo.seller2@spliton.test';
const BUYER_EMAIL = 'secondary.demo.buyer@spliton.test';
const DEFAULT_PASSWORD = process.env.SECONDARY_DEMO_PASSWORD ?? 'SecondaryDemo2026!';

type ListingSeed = {
  sellerEmail: string;
  price: string;
  units: string;
};

type ReleaseMarketSeed = {
  slug: string;
  listings: ListingSeed[];
  bidPrice: string;
  bidUnits: string;
};

const MARKETS: ReleaseMarketSeed[] = [
  {
    slug: 'midnight-code',
    listings: [
      { sellerEmail: SELLER1_EMAIL, price: '24.50', units: '8' },
      { sellerEmail: SELLER2_EMAIL, price: '25.00', units: '12' },
      { sellerEmail: SELLER1_EMAIL, price: '26.00', units: '5' },
    ],
    bidPrice: '23.00',
    bidUnits: '30',
  },
  {
    slug: 'neon-tide',
    listings: [
      { sellerEmail: SELLER1_EMAIL, price: '19.50', units: '10' },
      { sellerEmail: SELLER2_EMAIL, price: '20.00', units: '6' },
    ],
    bidPrice: '18.50',
    bidUnits: '25',
  },
];

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
        sourceEntityType: 'secondary_market_starter_seed',
        sourceEntityId: wallet.id,
        actorRole: ActorRole.SYSTEM,
      },
    });
  }

  return wallet;
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

async function ensureSellerPosition(
  userId: string,
  releaseId: string,
  totalUnits: string,
  avgEntry: string,
) {
  const total = new Prisma.Decimal(totalUnits);
  const existing = await prisma.userPosition.findUnique({
    where: { userId_releaseId: { userId, releaseId } },
  });

  if (existing) {
    const locked = existing.unitsLocked;
    const available = total.minus(locked);
    if (available.lessThan(0)) {
      throw new Error(
        `Position ${userId}/${releaseId}: locked units exceed total (${locked} > ${total})`,
      );
    }
    await prisma.userPosition.update({
      where: { userId_releaseId: { userId, releaseId } },
      data: {
        unitsTotal: total,
        unitsAvailable: available,
        avgEntryPrice: new Prisma.Decimal(avgEntry),
      },
    });
  } else {
    await prisma.userPosition.create({
      data: {
        userId,
        releaseId,
        unitsTotal: total,
        unitsAvailable: total,
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(avgEntry),
      },
    });
  }

  await ensurePrimaryBuyLedger(userId, releaseId, totalUnits, avgEntry);
}

async function ensureListing(
  sellerId: string,
  releaseId: string,
  price: string,
  units: string,
) {
  const priceDec = new Prisma.Decimal(price);
  const unitsDec = new Prisma.Decimal(units);

  const existing = await prisma.marketListing.findFirst({
    where: {
      sellerUserId: sellerId,
      releaseId,
      pricePerUnit: priceDec,
      status: ListingStatus.ACTIVE,
      deletedAt: null,
    },
  });
  if (existing) {
    if (!existing.unitsAvailable.equals(unitsDec)) {
      await prisma.marketListing.update({
        where: { id: existing.id },
        data: {
          unitsTotal: unitsDec,
          unitsAvailable: unitsDec,
        },
      });
    }
    return existing;
  }

  const position = await prisma.userPosition.findUnique({
    where: { userId_releaseId: { userId: sellerId, releaseId } },
  });
  if (!position) throw new Error(`Seller position missing for listing seed (${sellerId})`);

  const avail = position.unitsAvailable;
  if (avail.lessThan(unitsDec)) {
    const topUp = unitsDec.minus(avail);
    await prisma.userPosition.update({
      where: { userId_releaseId: { userId: sellerId, releaseId } },
      data: {
        unitsTotal: { increment: topUp },
        unitsAvailable: { increment: topUp },
      },
    });
  }

  await prisma.userPosition.update({
    where: { userId_releaseId: { userId: sellerId, releaseId } },
    data: {
      unitsLocked: { increment: unitsDec },
      unitsAvailable: { decrement: unitsDec },
    },
  });

  return prisma.marketListing.create({
    data: {
      releaseId,
      sellerUserId: sellerId,
      pricePerUnit: priceDec,
      unitsTotal: unitsDec,
      unitsAvailable: unitsDec,
      status: ListingStatus.ACTIVE,
    },
  });
}

async function ensureOrderBookSnapshot(
  releaseId: string,
  bidPrice: string,
  bidUnits: string,
  bestAskPrice: string,
  askDepthUnits: string,
) {
  const bid = new Prisma.Decimal(bidPrice);
  const ask = new Prisma.Decimal(bestAskPrice);
  const spread = ask.minus(bid);

  const recent = await prisma.orderBookSnapshot.findFirst({
    where: { releaseId },
    orderBy: { capturedAt: 'desc' },
  });

  if (
    recent &&
    recent.topBidPrice?.equals(bid) &&
    recent.topAskPrice?.equals(ask) &&
    recent.bidDepthUnits?.equals(new Prisma.Decimal(bidUnits)) &&
    recent.askDepthUnits?.equals(new Prisma.Decimal(askDepthUnits))
  ) {
    return recent;
  }

  return prisma.orderBookSnapshot.create({
    data: {
      releaseId,
      capturedAt: new Date(),
      topBidPrice: bid,
      topAskPrice: ask,
      spreadAmount: spread,
      bidDepthUnits: new Prisma.Decimal(bidUnits),
      askDepthUnits: new Prisma.Decimal(askDepthUnits),
    },
  });
}

async function seedReleaseMarket(
  config: ReleaseMarketSeed,
  usersByEmail: Map<string, { id: string }>,
) {
  const release = await prisma.release.findUnique({ where: { slug: config.slug } });
  if (!release) {
    console.warn(`  skip ${config.slug}: release not found (run seed-catalog-starter.ts first)`);
    return null;
  }

  if (!release.secondaryEnabled) {
    await prisma.release.update({
      where: { id: release.id },
      data: { secondaryEnabled: true },
    });
  }

  const avgEntry = release.primaryUnitPrice?.toString() ?? '20';
  const sellerUnitsNeeded = config.listings.reduce((acc, l) => {
    const prev = acc.get(l.sellerEmail) ?? new Prisma.Decimal(0);
    acc.set(l.sellerEmail, prev.plus(l.units));
    return acc;
  }, new Map<string, Prisma.Decimal>());

  for (const [email, needed] of sellerUnitsNeeded) {
    const user = usersByEmail.get(email);
    if (!user) continue;
    const buffer = needed.mul(1.5).ceil();
    await ensureSellerPosition(user.id, release.id, buffer.toString(), avgEntry);
  }

  const createdListings = [];
  for (const listing of config.listings) {
    const seller = usersByEmail.get(listing.sellerEmail);
    if (!seller) continue;
    const row = await ensureListing(seller.id, release.id, listing.price, listing.units);
    createdListings.push(row);
  }

  const askDepth = config.listings.reduce(
    (sum, l) => sum.plus(l.units),
    new Prisma.Decimal(0),
  );
  const bestAsk = config.listings.reduce(
    (min, l) => (min === null || new Prisma.Decimal(l.price).lessThan(min) ? new Prisma.Decimal(l.price) : min),
    null as Prisma.Decimal | null,
  );

  await ensureOrderBookSnapshot(
    release.id,
    config.bidPrice,
    config.bidUnits,
    bestAsk?.toString() ?? config.bidPrice,
    askDepth.toString(),
  );

  const volume24h = createdListings.reduce(
    (sum, l) => sum.plus(l.pricePerUnit.mul(l.unitsAvailable)),
    new Prisma.Decimal(0),
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existingMetrics = await prisma.releaseMetricsDaily.findFirst({
    where: { releaseId: release.id, asOfDate: today },
  });

  if (existingMetrics) {
    await prisma.releaseMetricsDaily.update({
      where: { id: existingMetrics.id },
      data: {
        liquidityScore: 0.72,
        volume24hNotional: volume24h.toNumber(),
      },
    });
  } else {
    await prisma.releaseMetricsDaily.create({
      data: {
        releaseId: release.id,
        asOfDate: today,
        yieldPct: 9.5,
        liquidityScore: 0.72,
        volume24hNotional: volume24h.toNumber(),
      },
    });
  }

  return { release, listings: createdListings };
}

async function main() {
  console.log('Secondary market starter seed (idempotent)…');

  const seller1 = await upsertActiveUser(SELLER1_EMAIL, 'Secondary Demo Seller 1');
  const seller2 = await upsertActiveUser(SELLER2_EMAIL, 'Secondary Demo Seller 2');
  const buyer = await upsertActiveUser(BUYER_EMAIL, 'Secondary Demo Buyer');

  await ensureWallet(seller1.id, '100');
  await ensureWallet(seller2.id, '100');
  await ensureWallet(buyer.id, '2000');

  const usersByEmail = new Map([
    [SELLER1_EMAIL, seller1],
    [SELLER2_EMAIL, seller2],
    [BUYER_EMAIL, buyer],
  ]);

  const results = [];
  for (const market of MARKETS) {
    console.log(`  → ${market.slug}`);
    const result = await seedReleaseMarket(market, usersByEmail);
    if (result) results.push(result);
  }

  console.log('');
  console.log('--- Secondary market demo ---');
  for (const { release, listings } of results) {
    console.log(`${release.slug}: ${listings.length} active listing(s), order book snapshot ok`);
  }
  console.log(`Buyer (USDT):  ${BUYER_EMAIL}`);
  console.log(`Seller 1:      ${SELLER1_EMAIL}`);
  console.log(`Seller 2:      ${SELLER2_EMAIL}`);
  console.log(`Password:      SECONDARY_DEMO_PASSWORD or default SecondaryDemo2026!`);
  console.log('');
  console.log('Open: /dashboard/secondary-market → midnight-code or neon-tide');
}

main()
  .catch((err) => {
    console.error('Secondary market seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
