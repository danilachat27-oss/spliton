import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserSecurityPreferencesDto } from './account-center.types';

@Injectable()
export class UserSecurityPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string): Promise<UserSecurityPreferencesDto> {
    const row = await this.prisma.userSecurityPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return this.map(row);
  }

  async patch(
    userId: string,
    body: Partial<UserSecurityPreferencesDto>,
  ): Promise<UserSecurityPreferencesDto> {
    const row = await this.prisma.userSecurityPreference.upsert({
      where: { userId },
      create: {
        userId,
        withdrawalEmailConfirmationEnabled:
          body.withdrawalEmailConfirmationEnabled ?? false,
        withdrawalAddressWhitelistEnabled:
          body.withdrawalAddressWhitelistEnabled ?? false,
        suspiciousLoginAlertsEnabled: body.suspiciousLoginAlertsEnabled ?? true,
      },
      update: {
        ...(body.withdrawalEmailConfirmationEnabled !== undefined
          ? { withdrawalEmailConfirmationEnabled: body.withdrawalEmailConfirmationEnabled }
          : {}),
        ...(body.withdrawalAddressWhitelistEnabled !== undefined
          ? { withdrawalAddressWhitelistEnabled: body.withdrawalAddressWhitelistEnabled }
          : {}),
        ...(body.suspiciousLoginAlertsEnabled !== undefined
          ? { suspiciousLoginAlertsEnabled: body.suspiciousLoginAlertsEnabled }
          : {}),
      },
    });
    return this.map(row);
  }

  private map(row: {
    withdrawalEmailConfirmationEnabled: boolean;
    withdrawalAddressWhitelistEnabled: boolean;
    suspiciousLoginAlertsEnabled: boolean;
  }): UserSecurityPreferencesDto {
    return {
      withdrawalEmailConfirmationEnabled: row.withdrawalEmailConfirmationEnabled,
      withdrawalAddressWhitelistEnabled: row.withdrawalAddressWhitelistEnabled,
      suspiciousLoginAlertsEnabled: row.suspiciousLoginAlertsEnabled,
    };
  }
}
