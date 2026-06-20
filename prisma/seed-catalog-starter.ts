/**
 * Starter catalog releases for Spliton project DB (not e2e, not "Демо-релиз" text).
 * Idempotent upsert — safe to re-run.
 *
 * Usage (from repo root):
 *   npx tsx prisma/seed-catalog-starter.ts
 */
import { PrismaClient, ReleaseStatus } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const STARTER_RELEASES = [
  {
    slug: 'neon-tide',
    symbol: 'NEONTIDE',
    title: 'Neon Tide',
    artist: 'Astra Lane',
    artistSlug: 'astra-lane',
    genre: 'Electronic',
    price: 18,
    progress: 42,
    yield: 9.2,
    coverUrl:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d7c18?w=1000&h=1000&fit=crop',
    shortDescription:
      'Электронный сингл с фокусом на стриминг и первичный раунд Spliton.',
  },
  {
    slug: 'amber-lines',
    symbol: 'AMBLINES',
    title: 'Amber Lines',
    artist: 'North Atlas',
    artistSlug: 'north-atlas',
    genre: 'Indie',
    price: 14,
    progress: 28,
    yield: 8.4,
    coverUrl:
      'https://images.unsplash.com/photo-1511379938545-c1f69419868d?w=1000&h=1000&fit=crop',
    shortDescription:
      'Инди-релиз с прозрачной моделью распределения дохода для держателей юнитов.',
  },
  {
    slug: 'midnight-code',
    symbol: 'MIDCODE',
    title: 'Midnight Code',
    artist: 'Vera Kline',
    artistSlug: 'vera-kline',
    genre: 'Pop',
    price: 22,
    progress: 65,
    yield: 10.1,
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&h=1000&fit=crop',
    shortDescription:
      'Pop-релиз с активным первичным раундом — доступен для покупки юнитов на Spliton.',
  },
] as const;

async function upsertStarter(item: (typeof STARTER_RELEASES)[number]) {
  const artist = await prisma.artist.upsert({
    where: { slug: item.artistSlug },
    update: { name: item.artist },
    create: { slug: item.artistSlug, name: item.artist },
  });

  const totalUnits = 10_000;
  const soldUnits = Math.round((item.progress / 100) * totalUnits);
  const available = totalUnits - soldUnits;
  const raiseTarget = item.price * totalUnits;

  const existing = await prisma.release.findUnique({ where: { slug: item.slug } });

  const release = existing
    ? await prisma.release.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          title: item.title,
          genre: item.genre,
          segment: item.genre,
          status: ReleaseStatus.ACTIVE,
          coverUrl: item.coverUrl,
          shortDescription: item.shortDescription,
          description: `${item.title} — релиз на платформе Spliton. Доходность ориентировочная и не является гарантией.`,
          primaryUnitPrice: item.price,
          totalUnits,
          unitsAvailablePrimary: available,
          raiseTargetUsdt: raiseTarget,
          hardCapUsdt: raiseTarget * 1.2,
          holderSharePct: 70,
          artistSharePct: 25,
          platformSharePct: 5,
          secondaryEnabled: true,
        },
      })
    : await prisma.release.create({
        data: {
          slug: item.slug,
          symbol: item.symbol,
          title: item.title,
          genre: item.genre,
          segment: item.genre,
          payoutFrequency: 'MONTHLY',
          totalUnits,
          unitsAvailablePrimary: available,
          primaryUnitPrice: item.price,
          raiseTargetUsdt: raiseTarget,
          hardCapUsdt: raiseTarget * 1.2,
          status: ReleaseStatus.ACTIVE,
          coverUrl: item.coverUrl,
          shortDescription: item.shortDescription,
          description: `${item.title} — релиз на платформе Spliton. Доходность ориентировочная и не является гарантией.`,
          holderSharePct: 70,
          artistSharePct: 25,
          platformSharePct: 5,
          secondaryEnabled: true,
          releaseArtists: {
            create: { artistId: artist.id, role: 'MAIN' },
          },
        },
      });

  if (existing) {
    await prisma.releaseArtist.deleteMany({ where: { releaseId: release.id } });
    await prisma.releaseArtist.create({
      data: { releaseId: release.id, artistId: artist.id, role: 'MAIN' },
    });
  }

  await prisma.primaryRaiseRound.deleteMany({ where: { releaseId: release.id } });
  await prisma.primaryRaiseRound.create({
    data: {
      releaseId: release.id,
      name: 'Primary Round',
      status: 'LIVE',
      raiseTargetUsdt: raiseTarget,
      hardCapUsdt: raiseTarget * 1.2,
      totalUnits,
      soldUnits,
    },
  });

  await prisma.releaseMetricsDaily.deleteMany({ where: { releaseId: release.id } });
  await prisma.releaseMetricsDaily.create({
    data: {
      releaseId: release.id,
      asOfDate: new Date(),
      yieldPct: item.yield,
      liquidityScore: 0.62,
      volume24hNotional: 2400,
    },
  });

  return release;
}

async function main() {
  console.log('Seeding starter catalog releases…');
  for (const item of STARTER_RELEASES) {
    const r = await upsertStarter(item);
    console.log(`  ✓ ${r.slug} (${r.id}) — ${r.title}`);
  }
  const active = await prisma.release.count({ where: { deletedAt: null } });
  console.log(`Done. Active releases in DB: ${active}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
