/**
 * Breakdown of i18n-audit findings by area.
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

const findings = [];
const useI18nFiles = new Set();
const allTsxFiles = new Set();

function shouldScan(filePath) {
  if (!/\.(tsx|ts)$/.test(filePath)) return false;
  if (SKIP_FILE_RE.test(filePath)) return false;
  return true;
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else if (shouldScan(full)) onFile(full);
  }
}

function scanFile(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  allTsxFiles.add(rel);
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes("useI18n")) useI18nFiles.add(rel);

  const lines = content.split("\n");
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (/className|import |from |export |type |interface |const [A-Z_]+ =/.test(trimmed)) return;
    if (/ROUTES\.|\/api\/|http/.test(trimmed)) return;
    if (trimmed.includes("t(") || trimmed.includes('t("')) return;
    if (CYRILLIC_RE.test(line)) {
      const parts = rel.split("/");
      const area = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
      findings.push({
        area,
        file: rel,
        priority: rel.includes("/admin/") || rel.startsWith("features/admin") ? "P2" : "P1",
      });
    }
  });
}

for (const dir of SCAN_DIRS) walk(dir, scanFile);

const byArea = {};
for (const f of findings) {
  byArea[f.area] = (byArea[f.area] || 0) + 1;
}

console.log("# i18n audit breakdown\n");
console.log(`Total Cyrillic findings: ${findings.length}`);
console.log(`P1 (user-facing): ${findings.filter((f) => f.priority === "P1").length}`);
console.log(`P2 (admin): ${findings.filter((f) => f.priority === "P2").length}`);
console.log(`Files scanned: ${allTsxFiles.size}`);
console.log(`Files with useI18n: ${useI18nFiles.size}\n`);

console.log("## Top areas by hardcoded Cyrillic count\n");
Object.entries(byArea)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([k, v]) => console.log(`${String(v).padStart(5)}  ${k}`));
