import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const rows = await prisma.release.findMany({
  where: { deletedAt: null },
  select: { slug: true, title: true, status: true },
  orderBy: { createdAt: 'asc' },
});

const human = rows.filter((r) => {
  const s = r.slug;
  if (/^(e2e|cat|mo|ua|pp|pf|sec|payout|iso|wa|rev|split|cutoff|orphan|chart-rel)-/.test(s)) return false;
  if (s.startsWith('spliton-demo-') || s.startsWith('spliton-staging-')) return false;
  return true;
});

console.log('Human slug releases:', human.length);
for (const r of human) console.log(r.slug, r.status, r.title);

await prisma.$disconnect();
