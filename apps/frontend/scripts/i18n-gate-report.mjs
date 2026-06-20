/**
 * Export all i18n gate critical hits grouped by zone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Re-use gate logic inline
const i18nDir = path.join(root, "lib", "i18n");
const critical = [];

function addCritical(category, detail) {
  critical.push({ category, ...detail });
}

// ... copy minimal scan from gate - actually import by spawning gate with env

// Parse from running gate script output file if exists, else scan
const gateScript = path.join(__dirname, "i18n-release-gate.mjs");
const src = fs.readFileSync(gateScript, "utf8");

// Run the walk part - extract constants from gate file by eval approach
// Simpler: grep the gate output we saved

const outPath = path.join(root, "i18n-gate-full.txt");
if (!fs.existsSync(outPath)) {
  console.error("Run pnpm run i18n:gate > i18n-gate-full.txt first");
  process.exit(1);
}

const lines = fs.readFileSync(outPath, "utf8").split("\n");
const hits = lines.filter((l) => l.startsWith("[hardcoded-ui]") || l.startsWith("[raw-enum]") || l.startsWith("[dictionary]") || l.startsWith("[locale]"));

function zoneFor(file) {
  if (file.includes("secondary-market") || file.includes("secondary_market")) return "secondary-market";
  if (file.includes("/artist") || file.includes("artist-")) return "artist-portal";
  if (file.includes("statement") || file.includes("wallet")) return "statements-wallet";
  if (file.includes("features/admin") || file.includes("app/admin")) return "admin";
  if (file.includes("megamenu") || file.includes("preview")) return "megamenu-previews";
  if (file.includes("legal") || file.includes("privacy") || file.includes("terms") || file.includes("support")) return "legal-support-static";
  if (file.includes("meta") || file.includes("generateMetadata")) return "metadata";
  if (file.includes("profile") || file.includes("my-assets") || file.includes("fees") || file.includes("market-overview") || file.includes("guide")) return "other-ui";
  if (file.includes("catalog") || file.includes("dashboard") || file.includes("referral") || file.includes("partner") || file.includes("trust") || file.includes("news")) return "other-ui";
  return "other-ui";
}

const byZone = {};
const byFile = {};
for (const hit of hits) {
  const m = hit.match(/\] ([^:]+):(\d+)/);
  if (!m) continue;
  const file = m[1];
  const zone = zoneFor(file);
  byZone[zone] = (byZone[zone] ?? 0) + 1;
  byFile[file] = (byFile[file] ?? 0) + 1;
}

console.log("Total hits:", hits.length);
console.log("\nBy zone:");
for (const [z, c] of Object.entries(byZone).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${z}: ${c}`);
}
console.log("\nTop 30 files:");
for (const [f, c] of Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${c}\t${f}`);
}
