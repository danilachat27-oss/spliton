/**
 * Strict i18n audit for P2.1 critical scopes: auth + assets/wallet/payouts/sell.
 * Run: node scripts/i18n-audit-strict-critical.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SCAN_PATHS = [
  "components/auth",
  "components/compliance",
  "components/dashboard/assets",
  "features/assets",
  "app/login",
  "app/register",
  "app/forgot-password",
  "app/reset-password",
  "app/verify-email",
  "app/assets",
].map((p) => path.join(root, p));

const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "mocks"]);
const SKIP_FILE_RE = /\.(test|spec)\.(ts|tsx)$|\.mock\.|\/mocks\//;
const CYRILLIC_RE = /[\u0400-\u04FF]{3,}/;

const ALLOWLIST = [
  /password-track-toggle\.tsx$/,
  /auth-guard\.tsx$/,
  /assets-tabs\.ts$/, // deprecated static export
  /payout-flow-mock-data/,
  /payouts-mock-data/, // internal mock generators; user labels via t() at display
  /assets-mock-data/,
  /activity-mock-data/,
];

const findings = [];

function shouldScan(filePath) {
  if (!/\.(tsx|ts)$/.test(filePath)) return false;
  if (SKIP_FILE_RE.test(filePath)) return false;
  if (ALLOWLIST.some((re) => re.test(filePath.replace(/\\/g, "/")))) return false;
  return true;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (shouldScan(full)) scanFile(full);
  }
}

function scanFile(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (/className|import |from |export |type |interface |const [A-Z_]+ =/.test(trimmed)) return;
    if (/ROUTES\.|\/api\/|http|ru-RU/.test(trimmed)) return;
    if (trimmed.includes("t(") || trimmed.includes('t("') || trimmed.includes("tf(")) return;

    if (CYRILLIC_RE.test(line)) {
      const match = line.match(CYRILLIC_RE);
      findings.push({
        file: rel,
        line: idx + 1,
        text: match?.[0] ?? trimmed.slice(0, 60),
      });
    }
  });
}

for (const dir of SCAN_PATHS) walk(dir);

console.log("# i18n strict-critical audit (auth + financial)\n");
console.log(`Critical findings: ${findings.length}\n`);

for (const f of findings.slice(0, 50)) {
  console.log(`${f.file}:${f.line} — ${f.text}`);
}
if (findings.length > 50) {
  console.log(`\n… and ${findings.length - 50} more`);
}

process.exit(findings.length > 0 ? 1 : 0);
