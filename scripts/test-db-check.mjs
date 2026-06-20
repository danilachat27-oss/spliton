#!/usr/bin/env node
/**
 * Verify test database connectivity (used before e2e locally/CI).
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

const prisma = new PrismaClient();
try {
  const count = await prisma.user.count();
  console.log('[test-db] OK — connected, users:', count);
} catch (error) {
  console.error('[test-db] connection failed:', error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
