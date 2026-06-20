/**
 * One-off patch: add acceptedTerms/acceptedPrivacy to e2e register payloads.
 * Safe to re-run — skips files already using e2eRegisterPayload on register.
 */
const fs = require('fs');
const path = require('path');

const testRoot = path.join(__dirname, '..', 'test');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.ts') && ent.name !== 'register-e2e-user.ts') out.push(p);
  }
  return out;
}

function importPath(file) {
  const rel = path.relative(path.dirname(file), path.join(testRoot, 'helpers', 'register-e2e-user'));
  return rel.startsWith('.') ? rel.replace(/\\/g, '/') : './' + rel.replace(/\\/g, '/');
}

function patchFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes("/auth/register")) return false;

  const importLine = `import { e2eRegisterPayload } from '${importPath(file)}';\n`;
  if (!s.includes('e2eRegisterPayload')) {
    const idx = s.indexOf('\n', s.indexOf('import '));
    s = s.slice(0, idx + 1) + importLine + s.slice(idx + 1);
  }

  let changed = false;

  const patterns = [
    [
      /\.post\(['"]\/auth\/register['"]\)\s*\n\s*\.send\(\{\s*email,\s*password,\s*displayName:\s*('(?:\\'|[^'])*'|"(?:\\"|[^"])*")\s*\}\)/g,
      ".post('/auth/register')\n      .send(e2eRegisterPayload(email, password, $1))",
    ],
    [
      /\.post\(['"]\/auth\/register['"]\)\s*\n\s*\.send\(\{\s*email,\s*password\s*\}\)/g,
      ".post('/auth/register')\n      .send(e2eRegisterPayload(email, password))",
    ],
    [
      /\.post\(['"]\/auth\/register['"]\)\s*\n\s*\.send\(\{\s*email:\s*(\w+),\s*password(?:,\s*displayName:\s*('(?:\\'|[^'])*'|"(?:\\"|[^"])*"))?\s*\}\)/g,
      (m, emailVar, dn) =>
        dn
          ? `.post('/auth/register')\n      .send(e2eRegisterPayload(${emailVar}, password, ${dn}))`
          : `.post('/auth/register')\n      .send(e2eRegisterPayload(${emailVar}, password))`,
    ],
  ];

  for (const [re, repl] of patterns) {
    const next = s.replace(re, repl);
    if (next !== s) {
      s = next;
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(file, s);
  return changed;
}

let n = 0;
for (const file of walk(testRoot)) {
  if (patchFile(file)) {
    n++;
    console.log('patched', path.relative(testRoot, file));
  }
}
console.log('done', n, 'files');
