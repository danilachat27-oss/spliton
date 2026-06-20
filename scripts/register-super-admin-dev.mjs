#!/usr/bin/env node
/**
 * Create danila.chat27@gmail.com for prisma:seed SUPER_ADMIN grant (idempotent).
 * Usage: node scripts/register-super-admin-dev.mjs
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';

function loadEnvFile() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
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

loadEnvFile();

const backendRequire = createRequire(
  resolve(process.cwd(), 'apps/backend/package.json'),
);
const bcrypt = backendRequire('bcrypt');

const SUPER_ADMIN_EMAIL = 'danila.chat27@gmail.com';
const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    console.log(`[register-super-admin] already exists — activated ${SUPER_ADMIN_EMAIL}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    await tx.userProfile.create({
      data: { userId: user.id, displayName: 'Danila' },
    });
    const investorRole = await tx.role.findUnique({
      where: { code: UserRoleCode.INVESTOR },
    });
    if (!investorRole) throw new Error('INVESTOR role missing — run migrations first');
    await tx.userRole.create({
      data: { userId: user.id, roleId: investorRole.id },
    });
  });

  console.log(`[register-super-admin] OK — ${SUPER_ADMIN_EMAIL}`);
} catch (error) {
  console.error(
    '[register-super-admin] failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
