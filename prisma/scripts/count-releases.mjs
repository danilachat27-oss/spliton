import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const active = await prisma.release.count({ where: { deletedAt: null } });
const archived = await prisma.release.count({ where: { deletedAt: { not: null } } });
const activeRows = await prisma.release.findMany({
  where: { deletedAt: null },
  select: { slug: true, title: true, status: true },
  take: 20,
});

console.log('Active releases:', active);
console.log('Archived releases:', archived);
if (activeRows.length) {
  console.log('Remaining active:');
  for (const r of activeRows) console.log(`  ${r.slug} | ${r.status} | ${r.title}`);
}

await prisma.$disconnect();
