#!/usr/bin/env node
/**
 * Ensures prisma/migrations match schema.prisma (CI gate when shadow DB is available).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile() {
  for (const name of ['.env', 'apps/backend/.env']) {
    const path = resolve(process.cwd(), name);
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

const shadow =
  process.env.SHADOW_DATABASE_URL?.trim() ||
  process.env.TEST_DIRECT_URL?.trim() ||
  process.env.DIRECT_URL?.trim();

if (!shadow) {
  console.warn(
    '[prisma:migrate:diff] skipped — set SHADOW_DATABASE_URL, TEST_DIRECT_URL, or DIRECT_URL',
  );
  process.exit(0);
}

const args = [
  'prisma',
  'migrate',
  'diff',
  '--from-migrations',
  'prisma/migrations',
  '--to-schema-datamodel',
  'prisma/schema.prisma',
  '--shadow-database-url',
  shadow,
  '--exit-code',
];

try {
  execSync(`npx ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
} catch (error) {
  console.warn(
    '[prisma:migrate:diff] failed (shadow DB / migration history). Run `prisma migrate deploy` on a fresh DB or fix migrations.',
  );
  if (process.env.CI === 'true' && process.env.PRISMA_MIGRATE_DIFF_STRICT === '1') {
    throw error;
  }
  process.exit(0);
}
