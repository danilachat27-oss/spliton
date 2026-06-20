/**
 * Remove Next.js dev type artifacts before `tsc --noEmit`.
 * Only `.next/dev/types` — never the whole `.next/dev` folder while `next dev` runs.
 */
const fs = require('node:fs');
const path = require('node:path');

const targets = [
  path.join(__dirname, '..', '.next', 'dev', 'types'),
  path.join(__dirname, '..', '.next', 'types'),
];

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // ignore — typecheck should proceed
  }
}
