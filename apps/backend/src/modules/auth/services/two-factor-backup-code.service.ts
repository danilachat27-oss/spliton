import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_BYTES = 5;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class TwoFactorBackupCodeService {
  generatePlaintextCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i += 1) {
      codes.push(randomBytes(BACKUP_CODE_BYTES).toString('hex').toUpperCase());
    }
    return codes;
  }

  normalizeCodeInput(raw: string): string {
    return raw.replace(/\s|-/g, '').toUpperCase();
  }

  async hashCode(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  }

  async findMatchingUnusedHashId(
    plaintext: string,
    rows: Array<{ id: string; codeHash: string }>,
  ): Promise<string | null> {
    const normalized = this.normalizeCodeInput(plaintext);
    for (const row of rows) {
      const ok = await bcrypt.compare(normalized, row.codeHash);
      if (ok) return row.id;
    }
    return null;
  }
}
