import { Injectable } from '@nestjs/common';
import { UserRoleCode, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async createInvestorUser(params: {
    email: string;
    passwordHash: string;
    displayName?: string;
    status: UserStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: params.email,
          passwordHash: params.passwordHash,
          status: params.status,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: params.displayName?.trim() || null,
        },
      });

      const investorRole = await tx.role.findUnique({
        where: { code: UserRoleCode.INVESTOR },
      });

      if (!investorRole) throw new Error('Role INVESTOR is missing');

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: investorRole.id,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  }
}
