/**
 * Usage (from repo root):
 *   $env:UPDATE_PASSWORD="your-new-password"
 *   node --env-file=.env scripts/update-user-password.mjs <email> [email2 ...]
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "../apps/backend/package.json"));
const bcrypt = require("bcrypt");

const args = process.argv.slice(2);
const all = args.includes("--all");
const emails = args.filter((a) => a !== "--all").map((e) => e.trim().toLowerCase()).filter(Boolean);
if (!all && emails.length === 0) {
  console.error(
    "Usage: node --env-file=.env scripts/update-user-password.mjs [--all] <email> [email2 ...]",
  );
  process.exit(1);
}

let password = process.env.UPDATE_PASSWORD?.trim();
if (!password) {
  try {
    const raw = readFileSync(resolve("spliton_pass.txt"), "utf8");
    const m = raw.match(/splitoonn@gmail\.com\s*\r?\n([^\r\n]+)/i);
    if (m?.[1]) password = m[1].trim();
  } catch {
    /* no file */
  }
}
if (!password) {
  console.error("Set UPDATE_PASSWORD or spliton_pass.txt with splitoonn@gmail.com password line.");
  process.exit(1);
}

const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
const prisma = url
  ? new PrismaClient({ datasources: { db: { url } } })
  : new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);
  if (all) {
    const r = await prisma.user.updateMany({
      where: { deletedAt: null },
      data: { passwordHash, updatedAt: new Date() },
    });
    console.log(`OK: ${r.count} active user(s) updated`);
  } else for (const email of emails) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, status: true },
    });
    if (!user) {
      console.warn(`Skip (not found): ${email}`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, updatedAt: new Date() },
    });
    console.log(`OK: ${user.email} (${user.status})`);
  }
} finally {
  await prisma.$disconnect();
}
