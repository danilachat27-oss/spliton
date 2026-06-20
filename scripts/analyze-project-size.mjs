import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function dirSizeBytes(absPath) {
  if (!fs.existsSync(absPath)) return null;
  let total = 0;
  const stack = [absPath];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      try {
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          total += fs.statSync(full).size;
        }
      } catch {
        // skip inaccessible entries
      }
    }
  }
  return total;
}

function formatSize(bytes) {
  if (bytes === null) return "- (missing)";
  if (bytes === 0) return "0 B";
  const gb = bytes / 1024 ** 3;
  if (gb >= 0.01) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  if (mb >= 0.01) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

const rows = [
  ["Project root", "."],
  ["apps/frontend/.next", "apps/frontend/.next"],
  ["apps/frontend/node_modules", "apps/frontend/node_modules"],
  ["apps/backend/node_modules", "apps/backend/node_modules"],
  ["node_modules (root)", "node_modules"],
  ["apps/frontend/public", "apps/frontend/public"],
  ["apps/backend/dist", "apps/backend/dist"],
  ["apps/frontend/test-results", "apps/frontend/test-results"],
  ["apps/frontend/playwright-report", "apps/frontend/playwright-report"],
  ["apps/frontend/blob-report", "apps/frontend/blob-report"],
  ["apps/frontend/coverage", "apps/frontend/coverage"],
  ["apps/backend/coverage", "apps/backend/coverage"],
  [".turbo", ".turbo"],
];

console.log("# Spliton project size\n");
console.log("| Path | Size |");
console.log("|------|------|");

for (const [label, rel] of rows) {
  const abs = path.join(repoRoot, rel);
  const bytes = dirSizeBytes(abs);
  console.log(`| ${label} | ${formatSize(bytes)} |`);
}

const nextDir = path.join(repoRoot, "apps/frontend/.next");
if (fs.existsSync(nextDir)) {
  const turboCache = path.join(nextDir, "cache");
  const devDir = path.join(nextDir, "dev");
  console.log("\n### .next breakdown\n");
  console.log(`| apps/frontend/.next/cache | ${formatSize(dirSizeBytes(turboCache))} |`);
  console.log(`| apps/frontend/.next/dev | ${formatSize(dirSizeBytes(devDir))} |`);
}

console.log("");