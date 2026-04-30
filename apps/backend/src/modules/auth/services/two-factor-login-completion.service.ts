import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../auth.repository';
import type { AuthResponse, AuthTokens } from '../types/auth-response.type';
import {
  assertUserCanLogin,
  prismaUserToSafeUser,
} from '../utils/safe-user.mapper';
import { AuthAuditService } from './auth-audit.service';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

@Injectable()
export class TwoFactorLoginCompletionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authAuditService: AuthAuditService,
  ) {}

  async getUserForTwoFactor(
    userId: string,
  ): Promise<{ id: string; email: string; roles: string[] } | null> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      return null;
    }
    try {
      assertUserCanLogin(user.status);
    } catch {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((r) => r.role.code),
    };
  }

  async finalizeTwoFactorLogin(
    userId: string,
    tokens: AuthTokens,
    meta?: RequestMeta,
  ): Promise<AuthResponse> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    assertUserCanLogin(user.status);
    const safeUser = prismaUserToSafeUser(user);
    await this.authAuditService.logEvent({
      event: 'LOGIN_SUCCESS',
      actorUserId: safeUser.id,
      entityId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, email: safeUser.email },
    });
    return { user: safeUser, tokens };
  }
}
