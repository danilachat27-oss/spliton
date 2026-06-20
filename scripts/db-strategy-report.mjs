/**
 * Read-only DB strategy report. No migrations applied.
 * Usage: node --env-file=.env scripts/db-strategy-report.mjs
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const prisma = new PrismaClient();
const root = resolve(process.cwd());
const migrationsDir = join(root, 'prisma', 'migrations');

const CLOSEOUT_TABLES = [
  'notifications',
  'legal_policies',
  'treasury_accounts',
  'event_outbox',
  'idempotency_records',
  'referral_profiles',
  'partner_profiles',
  'system_announcements',
  'deposit_address_pool',
  '_prisma_migrations',
];

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT to_regclass($1)::text AS reg`,
    `public.${name}`,
  );
  return Boolean(rows[0]?.reg);
}

async function countTable(name) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::bigint AS c FROM "${name.replace(/"/g, '""')}"`,
    );
    return Number(rows[0]?.c ?? 0);
  } catch {
    return null;
  }
}

function maskUrl(url) {
  if (!url) return '(not set)';
  try {
    const u = new URL(url.replace(/^postgresql:/, 'postgres:'));
    return `${u.protocol}//${u.hostname}:${u.port || 'default'}/${u.pathname.replace(/^\//, '') || 'postgres'} (user set, password hidden)`;
  } catch {
    return '(set, unparsable)';
  }
}

try {
  console.log('=== DB Strategy Report (read-only) ===\n');
  console.log('DATABASE_URL target:', maskUrl(process.env.DATABASE_URL));
  console.log('DIRECT_URL target:', maskUrl(process.env.DIRECT_URL));
  console.log('TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL?.trim() ? 'SET' : 'NOT SET');
  console.log('');

  const hasMigrationsTable = await tableExists('_prisma_migrations');
  console.log('_prisma_migrations table:', hasMigrationsTable ? 'EXISTS' : 'MISSING');

  if (hasMigrationsTable) {
    const applied = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM "_prisma_migrations"
       ORDER BY finished_at DESC NULLS LAST
       LIMIT 10`,
    );
    const total = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS c FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`,
    );
    console.log('Applied migrations count:', total[0]?.c ?? 0);
    console.log('Latest applied:');
    for (const row of applied) {
      console.log(
        `  - ${row.migration_name} @ ${row.finished_at ?? 'pending'}${row.rolled_back_at ? ' (rolled back)' : ''}`,
      );
    }
  }

  const allTables = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  console.log('\nPublic tables count:', allTables.length);
  console.log('Sample tables:', allTables.slice(0, 15).map((r) => r.tablename).join(', '), allTables.length > 15 ? '...' : '');

  console.log('\n--- Closeout / critical tables ---');
  for (const t of CLOSEOUT_TABLES) {
    const exists = await tableExists(t);
    const count = exists ? await countTable(t) : null;
    console.log(`${t}: ${exists ? `EXISTS (rows≈${count})` : 'MISSING'}`);
  }

  const users = await tableExists('users')
    ? await countTable('users')
    : null;
  console.log('\nusers row count (data risk indicator):', users ?? 'n/a');

  let localMigrations = [];
  if (existsSync(migrationsDir)) {
    localMigrations = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort();
  }
  console.log('\nLocal migration folders:', localMigrations.length);
  if (localMigrations.length) {
    console.log('  First:', localMigrations[0]);
    console.log('  Last:', localMigrations[localMigrations.length - 1]);
  }

  console.log('\n--- Why P3005 on migrate deploy ---');
  console.log(
    'Prisma migrate deploy requires an empty DB OR an existing _prisma_migrations history.',
  );
  console.log(
    `This DB: schema not empty (${allTables.length} public tables), _prisma_migrations: ${hasMigrationsTable ? 'yes' : 'NO'}.`,
  );
  console.log(
    'Result: deploy tries to run init migration on non-empty DB → P3005.',
  );

  console.log('\n--- Recommended safe path ---');
  if (users != null && users > 0) {
    console.log('⚠ DB has user data — do NOT auto baseline/resolve on this URL without backup.');
  }
  console.log('PRIMARY (recommended): A) Dedicated clean staging/e2e Supabase project');
  console.log('  1. Create new project OR empty database');
  console.log('  2. Set DATABASE_URL (pooler) + DIRECT_URL (db.*.supabase.co:5432)');
  console.log('  3. npx prisma migrate deploy');
  console.log('  4. npm run prisma:seed (legal, deposit pool, etc.)');
  console.log('  5. Point TEST_DATABASE_URL at same or separate e2e project');
  console.log('');
  console.log('ALTERNATIVE C) Backup prod/dev → recreate empty staging → migrate deploy');
  console.log('');
  console.log('Option B) baseline current DB — ONLY if:');
  console.log('  - schema already matches latest migration SQL (drift check)');
  console.log('  - stakeholders accept marking all migrations applied without re-run');
  console.log('  - separate written baseline report (not automated here)');
} finally {
  await prisma.$disconnect();
}
