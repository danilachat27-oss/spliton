/**
 * Lightweight i18n/error unit checks (no Jest in frontend package yet).
 * Run: node scripts/run-i18n-unit-tests.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const i18nDir = path.join(root, "lib", "i18n");

function normalizeLocale(value) {
  const lower = String(value ?? "").trim().toLowerCase();
  if (["ru", "en", "es", "pt"].includes(lower)) return lower;
  const base = lower.split("-")[0];
  if (["ru", "en", "es", "pt"].includes(base)) return base;
  if (lower === "ka" || base === "ka" || lower === "ge") return "ru";
  return "ru";
}

assert.equal(normalizeLocale("ka"), "ru");
assert.equal(normalizeLocale("xx"), "ru");
assert.equal(normalizeLocale("es"), "es");
assert.equal(normalizeLocale("pt-BR"), "pt");

function extractKeysFromTsExport(filePath, options = {}) {
  const locales = options.locales ?? ["ru", "en", "es", "pt"];
  const src = fs.readFileSync(filePath, "utf8");

  function blockKeys(locale) {
    const tag = locale.toUpperCase();
    const re = new RegExp(`const ${tag}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`, "m");
    const match = src.match(re);
    assert.ok(match, `${path.basename(filePath)} missing ${locale} block`);
    const body = match[1];
    const spread = body.match(/^\s*\.\.\.(RU|EN)\s*,?/m)?.[1] ?? null;
    const keys = new Set([
      ...[...body.matchAll(/"([^"]+)":/g)].map((m) => m[1]),
      ...[...body.matchAll(/^\s*([A-Z_]+):/gm)].map((m) => m[1]),
    ]);
    return { keys, spread };
  }

  const cache = new Map();
  function keysFor(locale) {
    if (cache.has(locale)) return cache.get(locale);
    const { keys, spread } = blockKeys(locale);
    let merged = new Set(keys);
    if (spread === "EN") {
      for (const k of keysFor("en")) merged.add(k);
    } else if (spread === "RU") {
      for (const k of keysFor("ru")) merged.add(k);
    }
    cache.set(locale, merged);
    return merged;
  }

  const ruKeys = keysFor("ru");
  for (const locale of locales.filter((l) => l !== "ru")) {
    const locKeys = keysFor(locale);
    for (const key of ruKeys) {
      assert.ok(locKeys.has(key), `${path.basename(filePath)} missing ${locale} key: ${key}`);
    }
    assert.equal(locKeys.size, ruKeys.size, `${path.basename(filePath)} key count mismatch ${locale}`);
  }
}

extractKeysFromTsExport(path.join(i18nDir, "error-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "common-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "critical-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "auth-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "financial-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "shell-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "catalog-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "secondary-market-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "secondary-market-rules-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "disputes-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "admin-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "admin-analytics-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "admin-drawer-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "profile-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "analytics-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "system-status-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "news-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "fees-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "support-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "trust-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "dashboard-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "referral-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "partner-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "market-overview-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "legal-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "preview-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "artist-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "statements-messages.ts"));
extractKeysFromTsExport(path.join(i18nDir, "guide-messages.ts"));

const widgetPath = path.join(i18nDir, "widget-messages.ts");
extractKeysFromTsExport(widgetPath);

const errorSrc = fs.readFileSync(path.join(i18nDir, "error-messages.ts"), "utf8");
const ruBlock = errorSrc.match(/const RU[^=]*=\s*\{([\s\S]*?)\n\};/m)[1];
const ruKeys = [...ruBlock.matchAll(/([A-Z_]+):/g)].map((m) => m[1]);
for (const code of [
  "AUTH_REQUIRED",
  "SESSION_EXPIRED",
  "EMAIL_NOT_VERIFIED",
  "WALLET_INSUFFICIENT_BALANCE",
  "LEDGER_DRIFT_DETECTED",
  "SECONDARY_TRADE_CONFLICT",
  "UNKNOWN_ERROR",
]) {
  assert.ok(ruKeys.includes(code), `missing error code ${code}`);
}

function looksTechnical(message) {
  const lower = message.toLowerCase();
  return lower.includes("prisma") || lower.includes("sql") || lower.includes("internal server error");
}

function messageForApiError(code, locale, fallback) {
  const ru = {
    WALLET_INSUFFICIENT_BALANCE: "Недостаточно средств на кошельке.",
    UNKNOWN_ERROR: "Не удалось выполнить операцию. Попробуйте позже.",
  };
  const en = {
    WALLET_INSUFFICIENT_BALANCE: "Insufficient wallet balance.",
    UNKNOWN_ERROR: "Operation failed. Please try again.",
  };
  const dict = locale === "en" ? en : ru;
  if (code && dict[code]) return dict[code];
  if (fallback && fallback.trim() && !looksTechnical(fallback)) return fallback;
  return dict.UNKNOWN_ERROR;
}

assert.match(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "ru"), /Недостаточно/);
assert.match(
  messageForApiError(undefined, "en", "Internal server error: prisma P2002"),
  /Operation failed/,
);
assert.match(messageForApiError("NOT_A_REAL_CODE", "ru"), /Не удалось/);

const typesSrc = fs.readFileSync(path.join(i18nDir, "types.ts"), "utf8");
assert.match(typesSrc, /"ru", "en", "es", "pt"/);
assert.doesNotMatch(typesSrc, /"ka"/);

console.log("[i18n-unit] PASS — locale fallback, dictionary parity, error smoke");
