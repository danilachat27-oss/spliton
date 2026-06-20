/**
 * Spliton i18n release gate — fails on CRITICAL issues only.
 * Run: node scripts/i18n-release-gate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const i18nDir = path.join(root, "lib", "i18n");

const LOCALES = ["ru", "en", "es", "pt"];
const critical = [];

function addCritical(category, detail) {
  critical.push({ category, ...detail });
}

// ── 1. Locale config (no ka; pt-BR → pt) ─────────────────────────────────────
const typesSrc = fs.readFileSync(path.join(i18nDir, "types.ts"), "utf8");
if (/"ka"/.test(typesSrc)) {
  addCritical("locale", { file: "lib/i18n/types.ts", message: 'Supported locales must not include "ka"' });
}
if (!/"ru", "en", "es", "pt"/.test(typesSrc)) {
  addCritical("locale", { file: "lib/i18n/types.ts", message: "Missing ru/en/es/pt in SUPPORTED_LOCALES" });
}

const normSrc = fs.readFileSync(path.join(i18nDir, "normalize-locale.ts"), "utf8");
if (!/pt-BR|pt-br|"pt"/i.test(normSrc)) {
  addCritical("locale", { file: "lib/i18n/normalize-locale.ts", message: "pt-BR normalization missing" });
}

// ── 2. Dictionary key parity (ru keys ⊆ en/es/pt) ───────────────────────────
const MESSAGE_FILES = fs
  .readdirSync(i18nDir)
  .filter((f) => f.endsWith("-messages.ts") || f === "error-messages.ts")
  .map((f) => path.join(i18nDir, f));

function extractLocaleBlock(src, locale) {
  const tag = locale.toUpperCase();
  const re = new RegExp(`const ${tag}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`, "m");
  const m = src.match(re);
  if (!m) return null;
  const body = m[1];
  const spread = body.match(/^\s*\.\.\.(RU|EN)\s*,?/m)?.[1] ?? null;
  const keys = new Set([...body.matchAll(/"([^"]+)":/g)].map((x) => x[1]));
  const enumKeys = new Set([...body.matchAll(/^\s*([A-Z_]+):/gm)].map((x) => x[1]));
  return { quoted: keys, enum: enumKeys, spread };
}

function localeKeysFromFile(src, locale, cache = new Map()) {
  if (cache.has(locale)) return cache.get(locale);
  const block = extractLocaleBlock(src, locale);
  if (!block) return new Set();
  let keys = new Set([...block.quoted, ...block.enum]);
  if (block.spread === "EN") {
    for (const k of localeKeysFromFile(src, "en", cache)) keys.add(k);
  } else if (block.spread === "RU") {
    for (const k of localeKeysFromFile(src, "ru", cache)) keys.add(k);
  }
  cache.set(locale, keys);
  return keys;
}

for (const filePath of MESSAGE_FILES) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  const src = fs.readFileSync(filePath, "utf8");
  const ruKeys = localeKeysFromFile(src, "ru");
  if (ruKeys.size === 0) {
    addCritical("dictionary", { file: rel, message: "Missing RU block or keys" });
    continue;
  }
  for (const locale of LOCALES.filter((l) => l !== "ru")) {
    const locKeys = localeKeysFromFile(src, locale);
    if (locKeys.size === 0) {
      addCritical("dictionary", { file: rel, message: `Missing ${locale.toUpperCase()} block` });
      continue;
    }
    for (const key of ruKeys) {
      if (!locKeys.has(key)) {
        addCritical("dictionary", { file: rel, message: `Missing ${locale} key: ${key}` });
      }
    }
  }
}

// widget ES/PT must spread EN (full key coverage)
const widgetSrc = fs.readFileSync(path.join(i18nDir, "widget-messages.ts"), "utf8");
if (!/const ES[^=]*=\s*\{\s*\.\.\.EN/.test(widgetSrc) || !/const PT[^=]*=\s*\{\s*\.\.\.EN/.test(widgetSrc)) {
  addCritical("dictionary", { file: "lib/i18n/widget-messages.ts", message: "ES/PT must spread EN for full coverage" });
}

// ── 3. Hardcoded UI in production surfaces ───────────────────────────────────
const SCAN_ROOTS = ["app", "components", "features"].map((d) => path.join(root, d));
const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "mocks", "mocks"]);
const SKIP_FILE_RES = [
  /\.(test|spec)\.(ts|tsx)$/,
  /\.mock\./,
  /\/mocks\//,
  /lib\/i18n\//,
  /features\/admin\/lib\/.*-i18n\.ts$/,
  /dashboard-nav\.ts$/,
  /auth-guard\.tsx$/,
  /password-track-toggle\.tsx$/,
  /assets-tabs\.ts$/,
  /services-megamenu-page-preview/,
  /dashboard-reference-tokens/,
  /-mock-data/,
  /payout-flow-mock-data/,
  /payouts-mock-data/,
  /assets-mock-data/,
  /activity-mock-data/,
  /secondary-market-trading-analytics\.mock/,
  /secondary-market-listings\.mock/,
  /secondary-market-release-analytics-tab/,
  /book-math\.ts$/,
  /-styles\.ts$/,
  /\.types\.ts$/,
  /chart-densify/,
  /profile-ui\.ts$/,
];

const CYRILLIC = /[\u0400-\u04FF]{3,}/;
const JSX_TEXT_CYRILLIC = />([^<{]*[\u0400-\u04FF]{3,}[^<{]*)</;
const PROP_CYRILLIC =
  /(?:aria-label|placeholder|title|subtitle|hint|alt|label)\s*=\s*["'`][^"'`]*[\u0400-\u04FF]{3,}/;
const ENGLISH_UI_PROP =
  /(?:placeholder|aria-label|title)\s*=\s*["'](?:Select|Loading|Submit|Cancel|Retry|Error|Choose|Please)[^"']*["']/i;
const RAW_STATUS_JSX = /\{(?:row|item|record|r|data)\.(?:status|blockingCode|role)\}/;
const KA_USAGE = /(?:locale|language)\s*[=:]\s*["']ka["']|LOCALE_OPTIONS.*["']ka["']/;
const PT_BR_RAW = /["']pt-BR["'](?!.*normalizeLocale)/;

function shouldScanFile(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  if (!/\.(tsx|ts)$/.test(rel)) return false;
  if (SKIP_FILE_RES.some((re) => re.test(rel))) return false;
  return true;
}

function isAllowlistedLine(line) {
  const t = line.trim();
  if (!t || t.startsWith("//") || t.startsWith("*") || t.startsWith("import ") || t.startsWith("export type"))
    return true;
  if (/className|style=|src=|href=|pathname|ROUTES\.|\/images\//.test(t)) return true;
  if (/t\(|tf\(|a\.t\(|useAdminI18n|messageKey|labelKey|titleKey/.test(t)) return true;
  if (/console\.|process\.env|@deprecated/.test(t)) return true;
  // t() fallback second arg — still in dictionaries path
  if (/,\s*["'`][^"'`]*[\u0400-\u04FF]/.test(t) && /t\(/.test(t)) return true;
  return false;
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else if (shouldScanFile(full)) onFile(full);
  }
}

for (const dir of SCAN_ROOTS) {
  walk(dir, (filePath) => {
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf8");
    if (KA_USAGE.test(content)) {
      addCritical("locale", { file: rel, line: 0, message: 'Raw "ka" locale usage' });
    }
    if (filePath.endsWith(".tsx")) {
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (isAllowlistedLine(line)) return;
        if (JSX_TEXT_CYRILLIC.test(line)) {
          addCritical("hardcoded-ui", {
            file: rel,
            line: idx + 1,
            message: `JSX text: ${line.match(CYRILLIC)?.[0] ?? "…"}`,
          });
        }
        if (PROP_CYRILLIC.test(line)) {
          addCritical("hardcoded-ui", {
            file: rel,
            line: idx + 1,
            message: `Hardcoded prop: ${line.trim().slice(0, 80)}`,
          });
        }
        if (ENGLISH_UI_PROP.test(line) && !/useAdminI18n|admin\./.test(line)) {
          addCritical("hardcoded-ui", {
            file: rel,
            line: idx + 1,
            message: `Hardcoded EN UI prop: ${line.trim().slice(0, 80)}`,
          });
        }
        if (RAW_STATUS_JSX.test(line) && !/formatAdminStatus|statusLabel|formatTrackStatus|formatRoundStatus/.test(line)) {
          addCritical("raw-enum", {
            file: rel,
            line: idx + 1,
            message: "Possible raw status/role in JSX",
          });
        }
      });
    }
  });
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log("# Spliton i18n release gate\n");

const byCat = {};
for (const c of critical) {
  byCat[c.category] = (byCat[c.category] ?? 0) + 1;
}

if (critical.length === 0) {
  console.log("✅ PASS — 0 critical i18n issues\n");
  process.exit(0);
}

console.log(`❌ FAIL — ${critical.length} critical issue(s)\n`);
for (const [cat, n] of Object.entries(byCat)) {
  console.log(`- ${cat}: ${n}`);
}
console.log("");

const sample = critical.slice(0, 60);
for (const c of sample) {
  const loc = c.line ? `${c.file}:${c.line}` : c.file;
  console.log(`[${c.category}] ${loc} — ${c.message}`);
}
if (critical.length > sample.length) {
  console.log(`\n… and ${critical.length - sample.length} more`);
}

process.exit(1);
