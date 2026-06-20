#!/usr/bin/env node
/**
 * Read-only: verify critical tables exist after migrate deploy.
 * Uses TEST_DIRECT_URL / TEST_DATABASE_URL when set; else DIRECT_URL / DATABASE_URL.
 *
 * Usage (repo root):
 *   node scripts/db-critical-tables-check.mjs
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CRITICAL_TABLES = [
  '_prisma_migrations',
  'users',
  'wallets',
  'legal_policies',
  'user_legal_consents',
  'in_app_notifications',
  'treasury_accounts',
  'deposit_address_pool',
  'event_outbox',
  'idempotency_records',
  'referral_profiles',
  'partner_profiles',
  'system_announcements',
  'market_listings',
  'trades',
  'wallet_transactions',
];

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

function maskHost(url) {
  if (!url?.trim()) return '(not set)';
  try {
    const u = new URL(url.replace(/^postgresql:/, 'postgres:'));
    return `${u.hostname}:${u.port || 'default'}/${u.pathname.replace(/^\//, '') || 'postgres'}`;
  } catch {
    return '(set, unparsable)';
  }
}

loadEnvFile();

const testUrl = process.env.TEST_DATABASE_URL?.trim();
const testDirect = process.env.TEST_DIRECT_URL?.trim();
const usingTest = Boolean(testUrl || testDirect);

if (testUrl) process.env.DATABASE_URL = testUrl;
if (testDirect) process.env.DIRECT_URL = testDirect;

const prisma = new PrismaClient();
let failed = 0;

try {
  console.log('[critical-tables] target:', usingTest ? 'TEST_*' : 'DATABASE_URL/DIRECT_URL');
  console.log('[critical-tables] host:', maskHost(process.env.DATABASE_URL));
  console.log('');

  for (const name of CRITICAL_TABLES) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass($1)::text AS reg`,
      `public.${name}`,
    );
    const exists = Boolean(rows[0]?.reg);
    console.log(`${exists ? 'OK' : 'MISSING'}\t${name}`);
    if (!exists) failed += 1;
  }

  console.log('');
  if (failed === 0) {
    console.log('[critical-tables] PASS — all tables present');
  } else {
    console.log(`[critical-tables] FAIL — ${failed} missing`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error('[critical-tables] error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
