import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "../apps/backend/package.json"));
const bcrypt = require("bcrypt");

const envPath = resolve(".env");
const passRaw = readFileSync(resolve("spliton_pass.txt"), "utf8");
const loginEmail = "splitoonn@gmail.com";
const loginPassMatch = passRaw.match(/splitoonn@gmail\.com\s*\r?\n([^\r\n]+)/i);
const loginPassword = loginPassMatch?.[1]?.trim();
if (!loginPassword) throw new Error("splitoonn@gmail.com password missing in spliton_pass.txt");

const dbPasswords = [];
for (const label of ["db pass:", "db pass sign in:"]) {
  const m = passRaw.match(new RegExp(`${label}\\s*\\r?\\n([^\\r\\n]+)`, "i"));
  if (m?.[1]) dbPasswords.push(m[1].trim());
}

function loadEnv() {
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function patchPasswordInUrl(url, newPassword) {
  const u = new URL(url);
  u.password = newPassword;
  return u.toString();
}

async function tryUrl(url) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const count = await prisma.user.count();
    return { ok: true, count, prisma };
  } catch (e) {
    await prisma.$disconnect().catch(() => {});
    return { ok: false, error: e.message?.split("\n")[0] ?? String(e) };
  }
}

const env = loadEnv();
const urls = [
  ["DATABASE_URL", env.DATABASE_URL],
  ["DIRECT_URL", env.DIRECT_URL],
].filter(([, u]) => u);

let workingUrl = null;
let workingPrisma = null;

for (const dbPass of [...new Set(dbPasswords)]) {
  for (const [name, base] of urls) {
    const url = patchPasswordInUrl(base, dbPass);
    const r = await tryUrl(url);
    console.log(`Try ${name} (${dbPass.slice(0, 2)}***): ${r.ok ? `OK, users=${r.count}` : r.error}`);
    if (r.ok) {
      workingUrl = url;
      workingPrisma = r.prisma;
      break;
    }
  }
  if (workingUrl) break;
}

if (!workingUrl) {
  console.error("\nDB unreachable. Fix Supabase project / .env connection strings.");
  process.exit(1);
}

// Persist working password in .env
let envText = readFileSync(envPath, "utf8");
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  if (!env[key]) continue;
  const u = new URL(workingUrl);
  const updated = patchPasswordInUrl(env[key], u.password);
  envText = envText.replace(
    new RegExp(`^${key}=.*$`, "m"),
    `${key}="${updated}"`,
  );
}
writeFileSync(envPath, envText, "utf8");
console.log("\nUpdated .env with working DB password.");

const passwordHash = await bcrypt.hash(loginPassword, 12);
const updated = await workingPrisma.user.updateMany({
  where: { deletedAt: null },
  data: { passwordHash, updatedAt: new Date() },
});
console.log(`Password reset for ${updated.count} user(s).`);

const users = await workingPrisma.user.findMany({
  where: { deletedAt: null },
  select: { email: true, status: true },
  orderBy: { email: "asc" },
});
console.log("\nAccounts in DB:");
for (const u of users) console.log(`  - ${u.email} (${u.status})`);

let target = users.find(
  (u) => u.email.toLowerCase() === loginEmail.toLowerCase(),
);
if (!target) {
  console.log(`\nNo ${loginEmail} — creating via register would need API; upserting user...`);
  const created = await workingPrisma.user.create({
    data: {
      email: loginEmail,
      passwordHash,
      authProvider: "email",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    select: { email: true, status: true },
  });
  target = created;
  console.log(`Created ${created.email} (${created.status})`);
}

await workingPrisma.$disconnect();
console.log("\n--- LOGIN (app) ---");
console.log("Email:    ", loginEmail);
console.log("Password: ", loginPassword);
console.log("(same password set for all active users in DB)");
