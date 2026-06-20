import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { cleanupE2eUsers } from './helpers/cleanup-e2e-users';

for (const envPath of [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../.env'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_SKIP_GLOBAL_CLEANUP === '1') {
    return;
  }
  try {
    await cleanupE2eUsers();
  } catch (error) {
    console.warn(
      '[e2e] global teardown cleanup skipped or failed:',
      error instanceof Error ? error.message : error,
    );
  }
}
