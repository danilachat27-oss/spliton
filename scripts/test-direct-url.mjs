import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

function load(key) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(new RegExp(`^${key}=(.*)$`));
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  return '';
}

async function ping(label, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1 AS n`;
    console.log(`${label}: OK`);
    return true;
  } catch (e) {
    console.log(`${label}: FAIL — ${e.message?.split('\n')[0]}`);
    return false;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

const dbUrl = load('DATABASE_URL');
const directUrl = load('DIRECT_URL');
const u = new URL(dbUrl.replace(/^postgresql:/, 'postgres:'));
const ref = u.username.match(/^postgres\.(.+)$/)?.[1];
const pass = u.password;
const user = u.username;

const candidates = [
  ['DIRECT_URL (.env)', directUrl],
  ['direct + sslmode=require', directUrl.includes('?') ? `${directUrl}&sslmode=require` : `${directUrl}?sslmode=require`],
  ['session pooler :5432', `postgresql://${user}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`],
];
if (ref) {
  candidates.push([
    'postgres user @ db.ref',
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
  ]);
}

for (const [label, url] of candidates) {
  await ping(label, url);
}
