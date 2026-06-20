#!/usr/bin/env node
/**
 * Verify finance-critical schema objects exist (drift detection for e2e).
 *
 * Usage:
 *   TEST_DATABASE_URL=postgresql://... node scripts/test-db-drift-check.mjs
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  const root = resolve(process.cwd());
  for (const name of ['.env', 'apps/backend/.env']) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnvFile();

const testUrl = process.env.TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!testUrl) {
  console.error('Missing TEST_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

process.env.DATABASE_URL = testUrl;

const checks = [
  {
    label: 'ledger_postings table',
    sql: `SELECT to_regclass('public.ledger_postings')::text AS ok`,
  },
  {
    label: 'ledger_postings.operation_type column',
    sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='ledger_postings' AND column_name='operation_type' LIMIT 1`,
  },
  {
    label: 'deposit_watcher_states table',
    sql: `SELECT to_regclass('public.deposit_watcher_states')::text AS ok`,
  },
  {
    label: 'deposit_ingestion_logs table',
    sql: `SELECT to_regclass('public.deposit_ingestion_logs')::text AS ok`,
  },
  {
    label: 'compliance_notes table',
    sql: `SELECT to_regclass('public.compliance_notes')::text AS ok`,
  },
  {
    label: 'password_reset_tokens table',
    sql: `SELECT to_regclass('public.password_reset_tokens')::text AS ok`,
  },
  {
    label: 'report_jobs.storage_key column',
    sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='report_jobs' AND column_name='storage_key' LIMIT 1`,
  },
  {
    label: 'deposit_status CREDITED enum value',
    sql: `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'deposit_status' AND e.enumlabel = 'CREDITED' LIMIT 1`,
  },
];

const prisma = new PrismaClient();
let failed = 0;

try {
  let applied = 0;
  try {
    const migrations = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`,
    );
    applied = migrations[0]?.count ?? 0;
  } catch {
    console.warn('[test-db] WARN _prisma_migrations missing — run npm run test:db:setup');
  }
  console.log(`[test-db] applied migrations: ${applied}`);

  for (const check of checks) {
    const rows = await prisma.$queryRawUnsafe(check.sql);
    const ok = Array.isArray(rows) && rows.length > 0 && Object.values(rows[0] ?? {}).some(Boolean);
    if (ok) {
      console.log(`[test-db] OK  ${check.label}`);
    } else {
      console.error(`[test-db] FAIL ${check.label}`);
      failed += 1;
    }
  }
} catch (error) {
  console.error('[test-db] drift check error:', error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

if (failed > 0) {
  console.error(`[test-db] ${failed} drift check(s) failed — run: npm run test:db:setup`);
  process.exit(1);
}

console.log('[test-db] schema drift check passed');
