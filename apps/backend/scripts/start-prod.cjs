const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '../..');

const candidates = [
  path.join(backendRoot, 'dist', 'main.js'),
  path.join(backendRoot, 'dist', 'src', 'main.js'),
  path.join(repoRoot, 'dist', 'main.js'),
  path.join(repoRoot, 'dist', 'src', 'main.js'),
  path.join(repoRoot, 'dist', 'apps', 'backend', 'main.js'),
  path.join(repoRoot, 'dist', 'apps', 'backend', 'src', 'main.js'),
];

const entry = candidates.find((file) => fs.existsSync(file));

if (!entry) {
  console.error('Cannot find built backend entry file.');
  console.error('Checked paths:');
  for (const file of candidates) {
    console.error(`- ${file}`);
  }

  const distDir = path.join(backendRoot, 'dist');
  if (fs.existsSync(distDir)) {
    console.error('Existing dist files:');
    const listFiles = (dir) => {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          listFiles(full);
        } else {
          console.error(`- ${full}`);
        }
      }
    };
    listFiles(distDir);
  }

  process.exit(1);
}

console.log(`Starting backend from: ${entry}`);

const result = spawnSync(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
