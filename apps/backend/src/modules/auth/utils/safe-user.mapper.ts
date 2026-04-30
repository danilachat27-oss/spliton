import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import type { SafeUserResponse } from '../types/auth-response.type';

export type PrismaUserForSafeMap = {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  profile: { displayName: string | null } | null;
  userRoles: Array<{ role: { code: string } }>;
};

export function prismaUserToSafeUser(
  user: PrismaUserForSafeMap,
): SafeUserResponse {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    profile: user.profile ? { displayName: user.profile.displayName } : null,
    roles: user.userRoles.map((row) => row.role.code),
  };
}

export function assertUserCanLogin(status: UserStatus): void {
  if (
    status === UserStatus.BANNED ||
    status === UserStatus.SUSPENDED ||
    status === UserStatus.DELETED
  ) {
    throw new UnauthorizedException('Invalid credentials');
  }
}
