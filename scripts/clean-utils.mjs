import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function removePathRel(relPath) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) {
    console.log(`  skip (missing): ${relPath}`);
    return false;
  }
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`  removed: ${relPath}`);
  return true;
}

export function removeEmptyE2eLogs() {
  const dir = path.join(repoRoot, "apps", "frontend");
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!/^e2e-full-run.*\.log$/i.test(name)) continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isFile() && stat.size === 0) {
      fs.rmSync(abs, { force: true });
      console.log(`  removed empty log: apps/frontend/${name}`);
      count += 1;
    }
  }
  if (count === 0) {
    console.log("  no empty e2e-full-run*.log files");
  }
  return count;
}