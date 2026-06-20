#!/usr/bin/env node
/**
 * Grant SUPER_ADMIN to danila.chat27@gmail.com and set password from spliton_pass.txt (idempotent).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, UserRoleCode, UserStatus } from "@prisma/client";

const require = createRequire(resolve("apps/backend/package.json"));
const bcrypt = require("bcrypt");

const EMAIL = "danila.chat27@gmail.com";
const prisma = new PrismaClient();

function readPasswordFromFile() {
  const raw = readFileSync(resolve("spliton_pass.txt"), "utf8");
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => l.toLowerCase() === EMAIL.toLowerCase());
  if (idx >= 0 && lines[idx + 1]) return lines[idx + 1];
  return process.env.UPDATE_PASSWORD?.trim() || null;
}

try {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) {
    console.error(`User not found: ${EMAIL}. Run: node scripts/register-super-admin-dev.mjs`);
    process.exit(1);
  }

  await prisma.role.upsert({
    where: { code: UserRoleCode.SUPER_ADMIN },
    update: { name: "Super Admin" },
    create: { code: UserRoleCode.SUPER_ADMIN, name: "Super Admin" },
  });

  const superRole = await prisma.role.findUnique({
    where: { code: UserRoleCode.SUPER_ADMIN },
  });
  const hasSuper = user.userRoles.some((r) => r.role.code === UserRoleCode.SUPER_ADMIN);
  if (!hasSuper && superRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: superRole.id },
    });
    console.log(`Granted SUPER_ADMIN to ${EMAIL}`);
  } else {
    console.log(`Already has SUPER_ADMIN: ${EMAIL}`);
  }

  const password = readPasswordFromFile();
  if (!password) {
    console.error("Password not found in spliton_pass.txt or UPDATE_PASSWORD");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  const roles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: { select: { code: true } } },
  });
  console.log(`OK: ${EMAIL} — roles: ${roles.map((r) => r.role.code).join(", ")}`);
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
