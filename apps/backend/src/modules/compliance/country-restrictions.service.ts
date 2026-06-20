import { HttpStatus, Injectable } from '@nestjs/common';
import { CountryRestrictionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';

export type CountryScope =
  | 'registration'
  | 'deposits'
  | 'withdrawals'
  | 'primary'
  | 'secondary'
  | 'payouts';

@Injectable()
export class CountryRestrictionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.countryRestriction.findMany({
      orderBy: { countryCode: 'asc' },
    });
  }

  async upsert(
    countryCode: string,
    data: {
      status: CountryRestrictionStatus;
      reason?: string;
      appliesTo: Record<CountryScope, boolean>;
    },
  ) {
    return this.prisma.countryRestriction.upsert({
      where: { countryCode: countryCode.toUpperCase() },
      create: {
        countryCode: countryCode.toUpperCase(),
        status: data.status,
        reason: data.reason,
        appliesTo: data.appliesTo,
      },
      update: {
        status: data.status,
        reason: data.reason,
        appliesTo: data.appliesTo,
      },
    });
  }

  async checkCountry(
    countryCode: string,
    scope: CountryScope,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const row = await this.prisma.countryRestriction.findUnique({
      where: { countryCode: countryCode.toUpperCase() },
    });
    if (!row) return { allowed: true };
    const applies = row.appliesTo as Record<string, boolean>;
    if (!applies[scope]) return { allowed: true };
    if (row.status === CountryRestrictionStatus.ALLOWED) return { allowed: true };
    return {
      allowed: false,
      reason:
        row.reason ??
        'Country restricted for this operation (requires legal review)',
    };
  }

  async delete(countryCode: string) {
    const code = countryCode.toUpperCase();
    const row = await this.prisma.countryRestriction.findUnique({
      where: { countryCode: code },
    });
    if (!row) {
      throwAdminError('NOT_FOUND', 'Country rule not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.countryRestriction.delete({ where: { countryCode: code } });
    return { ok: true };
  }
}
