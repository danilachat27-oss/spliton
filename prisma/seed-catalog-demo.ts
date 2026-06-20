/**
 * Optional dev/demo catalog seed — does not run automatically.
 * Usage: npx tsx prisma/seed-catalog-demo.ts
 *
 * Creates professional-looking Spliton demo releases without touching e2e test naming patterns.
 */
import { PrismaClient, ReleaseStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_RELEASES = [
  {
    slug: "spliton-demo-neon-tide",
    symbol: "SPLNEON",
    title: "Neon Tide",
    artist: "Astra Lane",
    genre: "Electronic",
    price: 18,
    progress: 62,
    yield: 9.4,
  },
  {
    slug: "spliton-demo-amber-lines",
    symbol: "SPLAMBR",
    title: "Amber Lines",
    artist: "North Atlas",
    genre: "Indie",
    price: 14,
    progress: 41,
    yield: 8.1,
  },
  {
    slug: "spliton-demo-midnight-code",
    symbol: "SPLMIDN",
    title: "Midnight Code",
    artist: "Vera Kline",
    genre: "Pop",
    price: 22,
    progress: 88,
    yield: 11.2,
  },
] as const;

async function main() {
  for (const demo of DEMO_RELEASES) {
    const artist = await prisma.artist.upsert({
      where: { slug: demo.slug.replace("spliton-demo-", "artist-") },
      update: { name: demo.artist },
      create: {
        slug: demo.slug.replace("spliton-demo-", "artist-"),
        name: demo.artist,
      },
    });

    const totalUnits = 1000;
    const soldUnits = Math.round((demo.progress / 100) * totalUnits);
    const available = totalUnits - soldUnits;

    const release = await prisma.release.upsert({
      where: { slug: demo.slug },
      update: {
        title: demo.title,
        genre: demo.genre,
        segment: demo.genre,
        status: ReleaseStatus.ACTIVE,
        primaryUnitPrice: demo.price,
        unitsAvailablePrimary: available,
        secondaryEnabled: true,
        shortDescription: `Демо-релиз Spliton — ${demo.title}. Ориентир доходности не является гарантией.`,
      },
      create: {
        slug: demo.slug,
        symbol: demo.symbol,
        title: demo.title,
        genre: demo.genre,
        segment: demo.genre,
        payoutFrequency: "MONTHLY",
        totalUnits,
        unitsAvailablePrimary: available,
        primaryUnitPrice: demo.price,
        raiseTargetUsdt: demo.price * totalUnits,
        hardCapUsdt: demo.price * totalUnits * 1.2,
        status: ReleaseStatus.ACTIVE,
        secondaryEnabled: true,
        shortDescription: `Демо-релиз Spliton — ${demo.title}. Ориентир доходности не является гарантией.`,
        releaseArtists: {
          create: { artistId: artist.id, role: "MAIN" },
        },
      },
    });

    await prisma.primaryRaiseRound.deleteMany({ where: { releaseId: release.id } });
    await prisma.primaryRaiseRound.create({
      data: {
        releaseId: release.id,
        status: "LIVE",
        raiseTargetUsdt: demo.price * totalUnits,
        hardCapUsdt: demo.price * totalUnits * 1.2,
        totalUnits,
        soldUnits,
      },
    });

    await prisma.releaseMetricsDaily.deleteMany({ where: { releaseId: release.id } });
    await prisma.releaseMetricsDaily.create({
      data: {
        releaseId: release.id,
        asOfDate: new Date(),
        yieldPct: demo.yield,
        liquidityScore: 0.55,
        volume24hNotional: 1200,
      },
    });
  }

  console.log(`Seeded ${DEMO_RELEASES.length} Spliton demo catalog releases.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
