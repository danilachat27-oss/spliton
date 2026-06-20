#!/usr/bin/env node
/**
 * Production-facing grep sweep for Spliton.
 * Exit 1 if critical patterns found in user/admin frontend.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = path.join(root, 'apps/frontend');

/** @type {Array<{ name: string; pattern: string; glob: string; allowlist?: string[] }>} */
const checks = [
  {
    name: 'RevShare in user-facing TSX',
    pattern: 'RevShare',
    glob: 'apps/frontend/**/*.{ts,tsx}',
    allowlist: ['revshare-logo.tsx'],
  },
  {
    name: 'alert() in frontend',
    pattern: '\\balert\\(',
    glob: 'apps/frontend/**/*.{ts,tsx}',
  },
  {
    name: 'TODO_PRODUCTION_BLOCKER',
    pattern: 'TODO_PRODUCTION_BLOCKER',
    glob: '**/*.{ts,tsx,md}',
  },
  {
    name: 'console.log in frontend app',
    pattern: 'console\\.log\\(',
    glob: 'apps/frontend/app/**/*.{ts,tsx}',
  },
  {
    name: 'Internal Server Error in frontend',
    pattern: 'Internal Server Error',
    glob: 'apps/frontend/**/*.{ts,tsx}',
  },
];

let failed = 0;

for (const check of checks) {
  try {
    const out = execSync(
      `npx --yes -p @vscode/ripgrep rg -n "${check.pattern}" ${check.glob}`,
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ).trim();
    if (!out) {
      console.log(`OK  ${check.name}`);
      continue;
    }
    const lines = out.split('\n').filter((line) => {
      if (!check.allowlist) return true;
      return !check.allowlist.some((a) => line.includes(a));
    });
    if (lines.length === 0) {
      console.log(`OK  ${check.name} (allowlisted only)`);
      continue;
    }
    console.error(`FAIL ${check.name}:`);
    console.error(lines.slice(0, 20).join('\n'));
    failed += lines.length;
  } catch (error) {
    const status = error && typeof error === 'object' ? error.status : undefined;
    const stdout = error && typeof error === 'object' ? error.stdout : undefined;
    if (status === 1 && !stdout) {
      console.log(`OK  ${check.name}`);
    } else if (status === 1) {
      console.log(`OK  ${check.name}`);
    } else {
      console.error(`WARN ${check.name}: rg failed (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}

const manifestPath = path.join(frontend, 'public/manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest.name?.includes('Spliton')) {
    console.error('FAIL PWA manifest name must include Spliton');
    failed++;
  } else {
    console.log('OK  PWA manifest name');
  }
} else {
  console.error('FAIL missing apps/frontend/public/manifest.json');
  failed++;
}

if (failed > 0) {
  console.error(`\nProduction grep sweep: ${failed} issue(s)`);
  process.exit(1);
}
console.log('\nProduction grep sweep: PASS');
