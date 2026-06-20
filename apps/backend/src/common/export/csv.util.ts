/** CSV export with formula-injection protection and UTF-8 BOM for Excel. */

import { createHash } from 'node:crypto';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  let raw: string;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    raw = String(value);
  } else {
    raw = JSON.stringify(value);
  }
  if (FORMULA_PREFIX.test(raw)) {
    raw = `'${raw}`;
  }
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildCsvFromTable(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCsvToTable(csv: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .split('\n')
    .filter((l) => l.length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}
