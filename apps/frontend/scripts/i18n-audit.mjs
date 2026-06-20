/**
 * Scans frontend source for likely hardcoded user-facing strings.
 * Run: node scripts/i18n-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SCAN_DIRS = ["components", "features", "app"].map((d) => path.join(root, d));
const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "test", "mocks"]);
const SKIP_FILE_RE = /\.(test|spec)\.(ts|tsx)$|\.mock\.|\/mocks\//;
const CYRILLIC_RE = /[\u0400-\u04FF]{3,}/;
const ENGLISH_UI_RE =
  />\s*([A-Z][a-z]+(?:\s+[a-z]+){1,6})\s*</;

const findings = [];

function shouldScan(filePath) {
  if (!/\.(tsx|ts)$/.test(filePath)) return false;
  if (SKIP_FILE_RE.test(filePath)) return false;
  if (filePath.includes(`${path.sep}docs${path.sep}`)) return false;
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
    if (/ROUTES\.|\/api\/|http/.test(trimmed)) return;
    if (trimmed.includes("t(") || trimmed.includes('t("')) return;

    if (CYRILLIC_RE.test(line)) {
      const match = line.match(CYRILLIC_RE);
      findings.push({
        file: rel,
        line: idx + 1,
        text: match?.[0] ?? trimmed.slice(0, 60),
        priority: rel.includes("/admin/") ? "P2" : "P1",
      });
    }
  });
}

for (const dir of SCAN_DIRS) walk(dir);

const byPriority = { P1: 0, P2: 0 };
for (const f of findings) byPriority[f.priority] = (byPriority[f.priority] ?? 0) + 1;

console.log("# i18n hardcoded strings audit\n");
console.log(`Total findings: ${findings.length} (P1: ${byPriority.P1}, P2: ${byPriority.P2})\n`);

const sample = findings.slice(0, 40);
for (const f of sample) {
  console.log(`[${f.priority}] ${f.file}:${f.line} — ${f.text}`);
}
if (findings.length > sample.length) {
  console.log(`\n… and ${findings.length - sample.length} more (see full list in CI artifact or re-run locally)`);
}

process.exit(0);
