'use strict';

/**
 * Runs `nest start --watch` and restarts after a crash (e.g. DB unavailable).
 * Ctrl+C stops without looping. Optional: NEST_DEV_RESTART_DELAY_MS (default 1500).
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const repoRoot = path.join(backendRoot, '..', '..');
const nestBin = path.join(backendRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(backendRoot, '.env'));

const RESTART_MS = Number(process.env.NEST_DEV_RESTART_DELAY_MS ?? 1500);
const MAX_RESTARTS = Number(process.env.NEST_DEV_MAX_RESTARTS ?? 12);

let child = null;
let shuttingDown = false;
let restartTimer = null;
let restartCount = 0;

function clearRestartTimer() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

function start() {
  if (shuttingDown) return;
  clearRestartTimer();

  child = spawn(process.execPath, [nestBin, 'start', '--watch'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (shuttingDown) {
      process.exit(0);
    }
    if (code === 0) {
      process.exit(0);
    }
    restartCount += 1;
    if (restartCount > MAX_RESTARTS) {
      console.error(
        `\n[nest-dev-restart] stopped after ${MAX_RESTARTS} crashes. Fix the error, then restart.\n`,
      );
      process.exit(code ?? 1);
    }
    console.error(
      `\n[nest-dev-restart] ended (${code ?? signal}). Retry ${restartCount}/${MAX_RESTARTS} in ${RESTART_MS}ms…\n`,
    );
    restartTimer = setTimeout(start, RESTART_MS);
  });
}

function shutdown() {
  shuttingDown = true;
  clearRestartTimer();
  if (child) {
    child.kill('SIGINT');
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
