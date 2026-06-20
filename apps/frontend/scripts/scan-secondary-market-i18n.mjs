import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "components/dashboard/secondary-market");

const JSX_TEXT_CYRILLIC = />([^<{]*[\u0400-\u04FF]{3,}[^<{]*)</;
const PROP_CYRILLIC =
  /(?:aria-label|placeholder|title|subtitle|hint|alt|label)\s*=\s*["'`][^"'`]*[\u0400-\u04FF]{3,}/;

function isAllowlistedLine(line) {
  const t = line.trim();
  if (!t || t.startsWith("//") || t.startsWith("*") || t.startsWith("import ") || t.startsWith("export type"))
    return true;
  if (/className|style=|src=|href=|pathname|ROUTES\.|\/images\//.test(t)) return true;
  if (/t\(|tf\(|a\.t\(|useAdminI18n|messageKey|labelKey|titleKey/.test(t)) return true;
  if (/console\.|process\.env|@deprecated/.test(t)) return true;
  if (/,\s*["'`][^"'`]*[\u0400-\u04FF]/.test(t) && /t\(/.test(t)) return true;
  return false;
}

let total = 0;
const byFile = {};

for (const f of fs.readdirSync(root)) {
  if (!f.endsWith(".tsx")) continue;
  const lines = fs.readFileSync(path.join(root, f), "utf8").split("\n");
  const hits = [];
  lines.forEach((line, idx) => {
    if (isAllowlistedLine(line)) return;
    if (JSX_TEXT_CYRILLIC.test(line) || PROP_CYRILLIC.test(line)) {
      hits.push({ line: idx + 1, text: line.trim().slice(0, 100) });
    }
  });
  if (hits.length) byFile[f] = hits;
  total += hits.length;
}

console.log(`Total gate-style hits: ${total}\n`);
for (const [file, hits] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${file}: ${hits.length}`);
  for (const h of hits.slice(0, 5)) console.log(`  L${h.line}: ${h.text}`);
  if (hits.length > 5) console.log(`  ... +${hits.length - 5} more`);
}
