#!/usr/bin/env node
/**
 * Fail if tracked source files look like UTF-16-LE (common Windows/Cursor pitfall).
 * Usage: node scripts/check-utf8.mjs [paths...]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("check-utf8: pass at least one file or directory path");
  process.exit(1);
}

function isUtf16Le(buf) {
  if (buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xfe) return true;
  const sample = buf.subarray(0, Math.min(buf.length, 200));
  let zeros = 0;
  for (let i = 1; i < sample.length; i += 2) {
    if (sample[i] === 0) zeros += 1;
  }
  return zeros > sample.length / 4;
}

const offenders = [];

function checkFile(file) {
  const buf = readFileSync(file);
  if (isUtf16Le(buf)) offenders.push(file);
}

function walk(path) {
  const st = statSync(path);
  if (st.isFile()) {
    if (/\.(ts|tsx|mts|cts|mjs|cjs|js|jsx)$/.test(path)) checkFile(path);
    return;
  }
  if (!st.isDirectory()) return;
  for (const name of readdirSync(path)) {
    if (name === "node_modules" || name === ".next") continue;
    walk(resolve(path, name));
  }
}

for (const root of roots) {
  walk(resolve(root));
}

if (offenders.length) {
  console.error("UTF-16-LE detected (convert to UTF-8):");
  for (const f of offenders) console.error(`  - ${relative(process.cwd(), f)}`);
  process.exit(1);
}

console.log(`check-utf8: OK (${roots.length} root path(s))`);
