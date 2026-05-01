import { Injectable } from '@nestjs/common';

type DevOutboxRecord = {
  to: string;
  maskedTo: string;
  userId: string;
  verifyUrl: string;
  createdAt: string;
};

@Injectable()
export class DevEmailOutboxService {
  private readonly records: DevOutboxRecord[] = [];

  push(input: { to: string; userId: string; verifyUrl: string }): void {
    this.records.push({
      to: input.to.trim().toLowerCase(),
      maskedTo: this.maskEmail(input.to),
      userId: input.userId,
      verifyUrl: input.verifyUrl,
      createdAt: new Date().toISOString(),
    });
    if (this.records.length > 200) {
      this.records.splice(0, this.records.length - 200);
    }
  }

  latestByEmail(email?: string): DevOutboxRecord | null {
    if (!email) {
      return this.records.at(-1) ?? null;
    }
    const target = email.trim().toLowerCase();
    for (let i = this.records.length - 1; i >= 0; i -= 1) {
      const row = this.records[i];
      if (row?.to === target) {
        return row;
      }
    }
    return null;
  }

  private maskEmail(email: string): string {
    const [local = '', domain = '***'] = email.split('@');
    if (!local) return `***@${domain}`;
    return `${local.charAt(0)}***@${domain}`;
  }
}
