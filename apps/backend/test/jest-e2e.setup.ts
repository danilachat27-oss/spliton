import { randomBytes } from 'crypto';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

for (const envPath of [
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../.env'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

process.env.NODE_ENV = 'test';

/** Stable e2e: bypass IP throttle (production never sets this). */
process.env.E2E_BYPASS_THROTTLE = 'true';
process.env.LOAD_TEST_MODE = 'true';

import { configureE2eDatabase } from './helpers/e2e-database-config';

configureE2eDatabase();

/** 32-byte AES key for 2FA e2e (base64); never log this value. */
if (!process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim()) {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');
}
