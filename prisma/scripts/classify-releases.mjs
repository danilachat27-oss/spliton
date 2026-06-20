import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const TEST_PREFIXES =
  /^(e2e-|cat-|mo-|ua-|pp-|pf-|sec-|payout-|iso-|wa-|rev-|split-|cutoff-|orphan-|chart-rel-|spliton-demo-|spliton-staging-)/i;

function isTestOrDemo(r) {
  if (TEST_PREFIXES.test(r.slug)) return true;
  if (r.slug.toLowerCase().includes('demo')) return true;
  if ((r.shortDescription || '').includes('Демо-релиз')) return true;
  if (/^\d+$/.test(r.slug)) return false;
  // timestamp-heavy slugs from tests: ends with long digit runs
  if (/-\d{10,}/.test(r.slug)) return true;
  return false;
}

const rows = await prisma.release.findMany({
  where: { deletedAt: null },
  select: {
    id: true,
    slug: true,
    title: true,
    status: true,
    shortDescription: true,
  },
  orderBy: { createdAt: 'desc' },
});

const prod = rows.filter((r) => !isTestOrDemo(r));
const test = rows.filter((r) => isTestOrDemo(r));

console.log('Total:', rows.length);
console.log('Test/demo to remove:', test.length);
console.log('Production-like to keep:', prod.length);
console.log('\n--- KEEP ---');
for (const r of prod) {
  console.log(`${r.slug} | ${r.status} | ${r.title}`);
}

await prisma.$disconnect();
