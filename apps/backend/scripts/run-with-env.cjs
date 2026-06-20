'use strict';

/**
 * Usage: node scripts/run-with-env.cjs KEY=value KEY2=value2 -- npm run start:dev
 * Sets env vars then spawns the command after `--`.
 */
const { spawn } = require('child_process');

const sep = process.argv.indexOf('--');
if (sep < 0) {
  console.error('Usage: node scripts/run-with-env.cjs KEY=value -- <command> [args...]');
  process.exit(1);
}

for (let i = 2; i < sep; i++) {
  const part = process.argv[i];
  const eq = part.indexOf('=');
  if (eq <= 0) continue;
  process.env[part.slice(0, eq)] = part.slice(eq + 1);
}

const cmd = process.argv[sep + 1];
const args = process.argv.slice(sep + 2);
if (!cmd) {
  console.error('Missing command after --');
  process.exit(1);
}

const child = spawn(cmd, args, {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 0));
