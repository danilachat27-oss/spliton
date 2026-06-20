import { existsSync } from 'node:fs';
import { join } from 'node:path';

function firstExisting(paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(path)) return path;
  }
  return null;
}

function assetCandidates(fileName: string): string[] {
  const cwd = process.cwd();
  return [
    join(cwd, 'assets/images/LOGO', fileName),
    join(cwd, 'apps/backend/assets/images/LOGO', fileName),
    join(cwd, 'apps/frontend/public/images/LOGO', fileName),
    join(__dirname, '../../../assets/images/LOGO', fileName),
    join(__dirname, '../../../../frontend/public/images/LOGO', fileName),
  ];
}

export function resolveSplitonLogoFullPath(): string | null {
  return firstExisting(assetCandidates('black-logo-nofon.png'));
}

export function resolveSplitonLogoMiniPath(): string | null {
  return firstExisting(assetCandidates('mini-logo.png'));
}
