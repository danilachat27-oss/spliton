const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
      continue;
    }
    if (/\.(tsx?|mts|cts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  if (file.endsWith(path.sep + "lib" + path.sep + "lucide.ts")) continue;
  const content = fs.readFileSync(file, "utf8");
  const next = content
    .replaceAll('from "lucide-react"', 'from "@/lib/lucide"')
    .replaceAll("from 'lucide-react'", "from '@/lib/lucide'");
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log("Updated " + changed + " files.");
