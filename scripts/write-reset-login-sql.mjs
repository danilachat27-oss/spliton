import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "../apps/backend/package.json"));
const bcrypt = require("bcrypt");

const raw = readFileSync(resolve("spliton_pass.txt"), "utf8");
const m = raw.match(/splitoonn@gmail\.com\s*\r?\n([^\r\n]+)/i);
if (!m?.[1]) throw new Error("Password line not found in spliton_pass.txt");
const passwordHash = await bcrypt.hash(m[1].trim(), 12);

const emails = [
  "splitoonn@gmail.com",
  "danila.titovets@gmail.com",
  "admin@revshare.local",
];

const sql = `-- Reset app login password (bcrypt cost 12) — password from spliton_pass.txt (splitoonn@gmail.com line)
-- Supabase → SQL Editor → Run

UPDATE users
SET password_hash = '${passwordHash}',
    updated_at = NOW()
WHERE deleted_at IS NULL;
`;

const out = resolve("scripts/reset-app-login-password.sql");
writeFileSync(out, sql, "utf8");
console.log("Wrote", out);
