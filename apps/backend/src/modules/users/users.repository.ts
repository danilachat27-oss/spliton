import { Injectable } from '@nestjs/common';
import { AppLocale } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserWithProfileAndRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true,
            countryCode: true,
            timezone: true,
            preferredLocale: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });
  }

  upsertProfile(
    userId: string,
    data: {
      preferredLocale?: AppLocale;
      displayName?: string;
      timezone?: string;
    },
  ) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLocale: data.preferredLocale ?? 'ru',
        displayName: data.displayName,
        timezone: data.timezone,
      },
      update: {
        ...(data.preferredLocale ? { preferredLocale: data.preferredLocale } : {}),
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
      },
    });
  }
}
