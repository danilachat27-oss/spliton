import fs from "node:fs";
import path from "node:path";

const root = path.resolve("features/admin");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/drawer|modal|dialog/i.test(e.name) && e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const tokensImport =
  'import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";';

let changed = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  if (!/variant="(outline|secondary)"/.test(s)) continue;
  const orig = s;
  s = s.replace(/variant="outline"/g, 'variant="ghost" className={adminBtnOutline}');
  s = s.replace(/variant="secondary"/g, 'variant="ghost" className={adminBtnSecondary}');
  s = s.replace(/className="[^"]*" className=\{adminBtnOutline\}/g, "className={adminBtnOutline}");
  if (!s.includes("@/features/admin/lib/admin-ui")) {
    const btnImport = s.match(/import \{ Button \} from "@\/components\/ui\/button";/);
    if (btnImport) s = s.replace(btnImport[0], `${btnImport[0]}\n${tokensImport}`);
    else s = `${tokensImport}\n${s}`;
  } else if (!/adminBtnOutline|adminBtnSecondary/.test(s.match(/import[^;]+admin-ui[^;]+;/)?.[0] ?? "")) {
    s = s.replace(
      /(import \{)([^}]*)(\} from "@\/features\/admin\/lib\/admin-ui";)/,
      (m, a, b, c) => {
        const parts = b.split(",").map((x) => x.trim()).filter(Boolean);
        if (!parts.includes("adminBtnOutline") && s.includes("adminBtnOutline")) parts.push("adminBtnOutline");
        if (!parts.includes("adminBtnSecondary") && s.includes("adminBtnSecondary")) parts.push("adminBtnSecondary");
        return `${a} ${parts.join(", ")} ${c}`;
      },
    );
  }
  if (s !== orig) {
    fs.writeFileSync(file, s, "utf8");
    changed += 1;
    console.log("updated", path.relative(root, file));
  }
}
console.log("files changed", changed);
