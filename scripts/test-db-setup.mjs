#!/usr/bin/env node
/**
 * Prepare an isolated test database: migrate deploy (+ optional role seed).
 *
 * Usage (repo root, with .env or explicit vars):
 *   TEST_DATABASE_URL=postgresql://... TEST_DIRECT_URL=postgresql://... node scripts/test-db-setup.mjs
 *   node scripts/test-db-setup.mjs --seed
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const withSeed = args.has('--seed');

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
const directUrl =
  process.env.TEST_DIRECT_URL?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  testUrl;

if (!testUrl) {
  console.error(
    'Missing TEST_DATABASE_URL (preferred) or DATABASE_URL. Use a dedicated Supabase project or local Postgres for e2e.',
  );
  process.exit(1);
}

process.env.DATABASE_URL = testUrl;
if (directUrl) process.env.DIRECT_URL = directUrl;

function assertSafeSetupTarget(url) {
  const lower = url.toLowerCase();
  if (
    (lower.includes('prod') || lower.includes('production')) &&
    process.env.ALLOW_E2E_SETUP !== '1'
  ) {
    console.error(
      '[test-db] Refusing setup on production-looking URL. Use a dedicated TEST_DATABASE_URL.',
    );
    process.exit(1);
  }
}

assertSafeSetupTarget(testUrl);

console.log('[test-db] migrate deploy…');
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: process.env,
});

if (withSeed) {
  console.log('[test-db] prisma db seed (roles + super admin hint)…');
  execSync('npx prisma db seed', { stdio: 'inherit', env: process.env });
}

console.log('[test-db] ready:', testUrl.replace(/:[^:@/]+@/, ':***@'));
