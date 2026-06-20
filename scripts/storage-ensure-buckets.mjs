#!/usr/bin/env node
/**
 * Idempotent Supabase Storage bucket setup for Spliton.
 * - listBuckets → createBucket only when missing
 * - never deletes buckets or objects
 *
 * Usage: node --env-file=.env scripts/storage-ensure-buckets.mjs
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const backendRequire = createRequire(
  resolve(process.cwd(), 'apps/backend/package.json'),
);
const { createClient } = backendRequire('@supabase/supabase-js');

function loadEnvFile() {
  const root = resolve(process.cwd());
  for (const name of ['.env', 'apps/backend/.env']) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
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
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnvFile();

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('[storage-ensure] Missing required env:');
  if (!url) console.error('  - SUPABASE_URL (https://<project-ref>.supabase.co)');
  if (!serviceKey) {
    console.error(
      '  - SUPABASE_SERVICE_ROLE_KEY (Dashboard → Project Settings → API → service_role)',
    );
  }
  console.error('');
  console.error(
    'Add both to .env, then rerun: node --env-file=.env scripts/storage-ensure-buckets.mjs',
  );
  process.exit(1);
}

/** Bucket id + visibility; env override via SUPABASE_STORAGE_* (see supabase-storage.service). */
const BUCKET_SPECS = [
  {
    id:
      process.env.SUPABASE_STORAGE_RELEASE_COVERS_BUCKET?.trim() ||
      'release-covers',
    public: true,
  },
  {
    id:
      process.env.SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET?.trim() ||
      'release-audio',
    public: false,
  },
  {
    id: process.env.SUPABASE_STORAGE_REPORTS_BUCKET?.trim() || 'reports',
    public: false,
  },
  {
    id:
      process.env.SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET?.trim() ||
      'user-documents',
    public: false,
  },
  {
    id: process.env.NEWS_MEDIA_BUCKET?.trim() || 'news-images',
    public: true,
  },
  {
    id: 'support-attachments',
    public: false,
  },
];

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error('[storage-ensure] listBuckets failed:', listErr.message);
  process.exit(1);
}

const names = new Set((existing ?? []).map((b) => b.name));
let created = 0;
let failed = 0;

console.log('[storage-ensure] project:', url.replace(/\/\/.*@/, '//***@'));

for (const spec of BUCKET_SPECS) {
  if (names.has(spec.id)) {
    console.log(`OK   exists: ${spec.id} (public=${spec.public})`);
    continue;
  }
  const { error } = await supabase.storage.createBucket(spec.id, {
    public: spec.public,
  });
  if (error) {
    console.error(`FAIL create ${spec.id}: ${error.message}`);
    failed += 1;
  } else {
    console.log(`OK   created: ${spec.id} (public=${spec.public})`);
    created += 1;
    names.add(spec.id);
  }
}

console.log('');
console.log(
  `[storage-ensure] done — created=${created}, failed=${failed}, total=${BUCKET_SPECS.length}`,
);

if (failed > 0) process.exit(1);
