/**
 * One-off helper: builds admin-analytics-messages.ts skeleton from RU strings.
 * EN/ES/PT use EN machine-friendly labels from key slug (replace manually for quality).
 */
import fs from "node:fs";
import path from "node:path";

const PREFIX = "admin.analytics";
const files = [
  "features/admin/analytics/components/admin-operations-analytics-filters.tsx",
  "features/admin/analytics/components/admin-risk-analytics-filters.tsx",
  "features/admin/analytics/components/admin-user-analytics-filters.tsx",
  "features/admin/analytics/components/admin-period-selector.tsx",
  "features/admin/analytics/components/admin-analytics-nav-cards.tsx",
  "features/admin/analytics/components/admin-analytics-export-button.tsx",
  "features/admin/sections/analytics/analytics-overview-section.tsx",
  "features/admin/sections/analytics/analytics-finance-section.tsx",
  "features/admin/sections/analytics/analytics-users-section.tsx",
  "features/admin/sections/analytics/analytics-tracks-section.tsx",
  "features/admin/sections/analytics/analytics-market-section.tsx",
  "features/admin/sections/analytics/analytics-revenue-section.tsx",
  "features/admin/sections/analytics/analytics-risk-section.tsx",
  "features/admin/sections/analytics/analytics-operations-section.tsx",
  "features/admin/lib/admin-analytics-i18n.ts",
];

const root = path.join(import.meta.dirname, "..");
const re = /["']([^"']*[А-Яа-яЁё][^"']*)["']/g;
const strings = new Set();
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  let m;
  while ((m = re.exec(src))) strings.add(m[1]);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "text";
}

const keyByRu = new Map();
const used = new Set();
for (const ru of [...strings].sort()) {
  let slug = slugify(ru);
  let n = 1;
  while (used.has(slug)) {
    slug = `${slugify(ru)}_${++n}`;
  }
  used.add(slug);
  keyByRu.set(ru, `${PREFIX}.${slug}`);
}

function block(name, locale, translate) {
  const lines = [`const ${name}: Record<string, string> = {`];
  for (const [ru, key] of keyByRu) {
    const val = translate(ru, key);
    lines.push(`  "${key}": ${JSON.stringify(val)},`);
  }
  lines.push("};");
  return lines.join("\n");
}

const enTranslate = (ru) => ru; // placeholder — hand-edit EN file section

const out = `import type { AppLocale } from "./types";

${block("RU", "ru", (ru) => ru)}

${block("EN", "en", (ru) => ru)}

const ES: Record<string, string> = { ...EN };
const PT: Record<string, string> = { ...EN };

export const ADMIN_ANALYTICS_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
`;

fs.writeFileSync(path.join(root, "lib", "i18n", "admin-analytics-messages.ts"), out, "utf8");
console.log("Wrote", keyByRu.size, "keys");
