import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function parseRef(url) {
  try {
    const u = new URL(url);
    const m = u.username.match(/^postgres\.([a-z0-9]+)$/i);
    return { host: u.hostname, port: u.port, ref: m?.[1] ?? null, mode: u.searchParams.get("pgbouncer") };
  } catch {
    return null;
  }
}

async function ping(label, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const c = await prisma.user.count();
    console.log(`${label}: OK (users=${c})`);
    return true;
  } catch (e) {
    console.log(`${label}: FAIL — ${e.message?.split("\n")[0]}`);
    return false;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

const env = loadEnv();
const dbUrl = env.DATABASE_URL;
const directUrl = env.DIRECT_URL;
const pooler = parseRef(dbUrl);
const direct = parseRef(directUrl);

console.log("=== Supabase + Prisma (project layout) ===\n");
console.log("Prisma schema: prisma/schema.prisma");
console.log("  url       → DATABASE_URL  (runtime + pooler)");
console.log("  directUrl → DIRECT_URL    (migrations / prisma migrate)\n");

if (pooler) {
  console.log("DATABASE_URL:");
  console.log(`  host: ${pooler.host}:${pooler.port}`);
  console.log(`  project ref: ${pooler.ref ?? "(not in username)"}`);
  console.log(`  pgbouncer: ${pooler.mode ?? "no"}`);
}
if (direct) {
  console.log("\nDIRECT_URL:");
  console.log(`  host: ${direct.host}:${direct.port}`);
  console.log(`  project ref: ${direct.ref ?? "(not in username)"}`);
  if (direct.host.includes("pooler.supabase.com")) {
    console.log("  ⚠ DIRECT_URL points at pooler — Supabase recommends db.<ref>.supabase.co:5432");
  }
}

console.log("\n=== Connection test ===\n");
let ok = await ping("DATABASE_URL (pooler)", dbUrl);
if (!ok && pooler?.ref) {
  const u = new URL(dbUrl);
  const altDirect = `postgresql://${u.username}:${u.password}@db.${pooler.ref}.supabase.co:5432/postgres`;
  await ping("Try db.<ref>.supabase.co:5432", altDirect);
  const altPooler = `postgresql://${u.username}:${u.password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
  await ping("Try pooler :5432 session", altPooler);
}

if (!ok) {
  console.log("\nIf all fail with 'tenant ... not found': project ref is wrong or project removed/paused in Supabase Dashboard.");
  process.exit(1);
}
