#!/usr/bin/env node
/**
 * Remove e2e users (@example.com patterns) from the test database.
 *
 * Usage:
 *   TEST_DATABASE_URL=postgresql://... node scripts/test-db-cleanup.mjs
 *
 * Safety: refuses staging/production URLs unless ALLOW_E2E_CLEANUP=1.
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

function assertSafeCleanupTarget(url) {
  const lower = url.toLowerCase();
  const env = (process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? '').toLowerCase();
  const blockedHostHints = ['prod', 'production', 'staging', 'spliton-prod', 'spliton-staging'];
  const blockedEnv = ['production', 'staging', 'prod'];

  if (blockedEnv.includes(env) && process.env.ALLOW_E2E_CLEANUP !== '1') {
    console.error(
      `[test-db] Refusing cleanup: ENVIRONMENT/NODE_ENV=${env}. Set ALLOW_E2E_CLEANUP=1 only on dedicated test DB.`,
    );
    process.exit(1);
  }

  for (const hint of blockedHostHints) {
    if (lower.includes(hint) && process.env.ALLOW_E2E_CLEANUP !== '1') {
      console.error(
        `[test-db] Refusing cleanup: URL looks like ${hint}. Use TEST_DATABASE_URL for a dedicated e2e project, or set ALLOW_E2E_CLEANUP=1 to override.`,
      );
      process.exit(1);
    }
  }

  const mainUrl = process.env.DATABASE_URL?.trim();
  const testUrl = process.env.TEST_DATABASE_URL?.trim();
  if (mainUrl && testUrl && mainUrl === testUrl && process.env.ALLOW_E2E_CLEANUP !== '1') {
    console.error(
      '[test-db] Refusing cleanup: TEST_DATABASE_URL equals DATABASE_URL. Use a dedicated test project.',
    );
    process.exit(1);
  }
}

loadEnvFile();

const testUrl = process.env.TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!testUrl) {
  console.error('Missing TEST_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

assertSafeCleanupTarget(testUrl);

process.env.DATABASE_URL = testUrl;

const prisma = new PrismaClient();
try {
  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: '@example.com' } },
  });
  console.log(`[test-db] removed ${result.count} e2e user(s)`);
} finally {
  await prisma.$disconnect();
}
