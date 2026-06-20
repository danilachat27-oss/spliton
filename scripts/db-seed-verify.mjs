#!/usr/bin/env node
/**
 * Read-only post-seed / post-migrate checks (roles, fees, treasury, legal, deposit pool).
 * Uses TEST_DATABASE_URL when set; else DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPER_ADMIN_EMAIL = 'danila.chat27@gmail.com';

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

const testUrl = process.env.TEST_DATABASE_URL?.trim();
if (testUrl) process.env.DATABASE_URL = testUrl;

const prisma = new PrismaClient();
let failed = 0;

function fail(msg) {
  console.log(`FAIL\t${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`OK\t${msg}`);
}

try {
  const superRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });
  if (!superRole) fail('SUPER_ADMIN role row missing (run npm run prisma:seed after migrate)');
  else ok('SUPER_ADMIN role exists');

  const user = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    include: {
      userRoles: { include: { role: true } },
    },
  });
  if (!user) {
    fail(`User ${SUPER_ADMIN_EMAIL} not registered — seed grants role after register`);
  } else {
    const hasSuper = user.userRoles.some((ur) => ur.role.code === 'SUPER_ADMIN');
    if (hasSuper) ok(`SUPER_ADMIN granted to ${SUPER_ADMIN_EMAIL}`);
    else fail(`User exists but SUPER_ADMIN not granted — run: npm run prisma:seed`);
  }

  const legalCount = await prisma.legalPolicy.count().catch(() => null);
  if (legalCount === null) fail('legal_policies table unavailable');
  else if (legalCount > 0) ok(`legal_policies rows=${legalCount} (seed or SEED_LEGAL_POLICIES_ON_BOOT)`);
  else ok('legal_policies empty — OK if admin will publish; or set SEED_LEGAL_POLICIES_ON_BOOT=true on boot');

  const poolCount = await prisma.depositAddressPool.count().catch(() => null);
  if (poolCount === null) fail('deposit_address_pool table unavailable');
  else ok(`deposit_address_pool rows=${poolCount} (admin can add via treasury API)`);

  const activeFee = await prisma.platformFeeSetting.findFirst({
    where: { isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  }).catch(() => null);
  if (!activeFee) fail('No active platform_fee_settings (migration seed or admin required)');
  else ok(`platform_fee_settings active id=${activeFee.id}`);

  const treasuryCount = await prisma.treasuryAccount.count().catch(() => null);
  if (treasuryCount === null) fail('treasury_accounts table unavailable');
  else if (treasuryCount > 0) ok(`treasury_accounts rows=${treasuryCount}`);
  else ok('treasury_accounts empty — OK; set SEED_TREASURY_ACCOUNTS_ON_BOOT=true or admin seed');

  console.log('');
  if (failed === 0) {
    console.log('[seed-verify] PASS');
  } else {
    console.log(`[seed-verify] FAIL — ${failed} check(s)`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error('[seed-verify] error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
