import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

function isDemoRelease(r) {
  const slug = r.slug.toLowerCase();
  const desc = (r.shortDescription || '').toLowerCase();
  return (
    slug.startsWith('spliton-demo-') ||
    slug.startsWith('spliton-staging-') ||
    slug.startsWith('e2e-') ||
    slug.includes('-demo-') ||
    slug.includes('demo-') ||
    desc.includes('демо-релиз') ||
    desc.includes('demo catalog')
  );
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

console.log('Total active releases:', rows.length);
const demo = rows.filter(isDemoRelease);
const real = rows.filter((r) => !isDemoRelease(r));
console.log('Demo:', demo.length);
console.log('Real:', real.length);
for (const r of rows) {
  console.log(`${isDemoRelease(r) ? '[DEMO]' : '[KEEP]'} ${r.slug} | ${r.status} | ${r.title}`);
}

await prisma.$disconnect();
