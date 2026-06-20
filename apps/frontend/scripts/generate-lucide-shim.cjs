const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const lucideEntry = path.join(root, "node_modules/lucide-react/dist/esm/lucide-react.js");
const iconsDir = path.join(root, "node_modules/lucide-react/dist/esm/icons");
const usedIcons = new Set();
function buildLucideIconPathMap() {
  const source = fs.readFileSync(lucideEntry, "utf8");
  const map = new Map();
  const exportRe = /export\s+\{([^}]+)\}\s+from\s+['"]\.\/icons\/([^'"]+)['"]/g;
  let match;
  while ((match = exportRe.exec(source))) {
    const iconFile = match[2].replace(/\.js$/, "");
    const names = match[1].match(/default as (\w+)/g) ?? [];
    for (const entry of names) {
      const name = entry.replace("default as ", "");
      if (name.startsWith("Lucide")) continue;
      map.set(name, iconFile);
    }
  }
  return map;
}
function collectUsedIcons(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      collectUsedIcons(full);
      continue;
    }
    if (!/\.(tsx?|mts|cts)$/.test(entry.name)) continue;
    const source = fs.readFileSync(full, "utf8");
    const re = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']@\/lib\/lucide["']/g;
    let match;
    while ((match = re.exec(source))) {
      for (const part of match[1].split(",")) {
        const trimmed = part.trim();
        if (!trimmed || trimmed.startsWith("type ")) continue;
        const name = trimmed.split(/\s+as\s+/)[0].trim();
        if (["LucideIcon", "LucideProps", "IconNode"].includes(name)) continue;
        if (/^[A-Z]/.test(name)) usedIcons.add(name);
      }
    }
  }
}
collectUsedIcons(root);
const iconPathMap = buildLucideIconPathMap();
const missing = [];
const sorted = [...usedIcons].sort();
const lines = [
  "/**",
  " * Lucide icons via per-icon ESM paths (not the package barrel).",
  " * Regenerate: node scripts/generate-lucide-shim.cjs",
  " */",
  'export type { IconNode, LucideIcon, LucideProps } from "lucide-react";',
  "",
];
for (const icon of sorted) {
  const iconFile = iconPathMap.get(icon);
  if (!iconFile) { missing.push(icon); continue; }
  const abs = path.join(iconsDir, iconFile + ".js");
  if (!fs.existsSync(abs)) { missing.push(icon + " (no file " + iconFile + ".js)"); continue; }
  lines.push(`export { default as ${icon} } from "lucide-react/dist/esm/icons/${iconFile}.js";`);
}
if (missing.length) { console.error("Missing:", missing.join(", ")); process.exit(1); }
const out = path.join(root, "lib", "lucide.ts");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log("Wrote " + sorted.length + " icons to " + out);
