import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { AuthRepository } from "./auth.repository";
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from "./dto";
import { AuthAuditService } from "./services/auth-audit.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";
import { AuthResponse, SafeUserResponse } from "./types/auth-response.type";
import { AuthUser } from "./types/auth-user.type";

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly authAuditService: AuthAuditService,
  ) {}

  async register(dto: RegisterDto, meta?: RequestMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;
    try {
      user = await this.authRepository.createInvestorUser({
        email,
        passwordHash,
        displayName: dto.displayName,
        status: UserStatus.ACTIVE,
      });
    } catch {
      throw new InternalServerErrorException("Unable to create user");
    }

    const safeUser = this.toSafeUser(user);
    const tokens = await this.issueSessionAndTokens({
      user: safeUser,
      meta,
    });

    await this.authAuditService.logEvent({
      event: "REGISTER",
      actorUserId: safeUser.id,
      entityId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, email: safeUser.email },
    });

    return {
      user: safeUser,
      tokens,
    };
  }

  async login(dto: LoginDto, meta?: RequestMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    // Avoid leaking whether email exists or password was wrong.
    if (!user?.passwordHash) {
      await this.authAuditService.logEvent({
        event: "LOGIN_FAILED",
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { email, reason: "INVALID_CREDENTIALS" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.authAuditService.logEvent({
        event: "LOGIN_FAILED",
        actorUserId: user.id,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: user.id, email, reason: "INVALID_CREDENTIALS" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    this.assertCanLogin(user.status);

    const safeUser = this.toSafeUser(user);
    const tokens = await this.issueSessionAndTokens({
      user: safeUser,
      meta,
    });

    await this.authAuditService.logEvent({
      event: "LOGIN_SUCCESS",
      actorUserId: safeUser.id,
      entityId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, email: safeUser.email },
    });

    return {
      user: safeUser,
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto, meta?: RequestMeta): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    const session = await this.sessionService.findSessionById(payload.sessionId);

    if (!session || session.userId !== payload.sub) {
      await this.authAuditService.logEvent({
        event: "REFRESH_FAILED",
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: payload.sub, sessionId: payload.sessionId, reason: "SESSION_NOT_FOUND" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (this.sessionService.isSessionExpired(session) || this.sessionService.isSessionRevoked(session)) {
      const isRotationReuse = session.revokedReason === "ROTATED";
      if (isRotationReuse) {
        await this.sessionService.revokeAllUserSessions({
          userId: payload.sub,
          reason: "REFRESH_REUSE_DETECTED",
        });
      }

      await this.authAuditService.logEvent({
        event: isRotationReuse ? "REFRESH_REUSE_DETECTED" : "REFRESH_FAILED",
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: isRotationReuse ? "ROTATED_TOKEN_REUSE" : "SESSION_INACTIVE",
        },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    const refreshMatches = await this.sessionService.verifySessionRefreshToken(session, dto.refreshToken);
    if (!refreshMatches) {
      await this.sessionService.revokeAllUserSessions({
        userId: payload.sub,
        reason: "REFRESH_REUSE_DETECTED",
      });
      await this.authAuditService.logEvent({
        event: "REFRESH_REUSE_DETECTED",
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: payload.sub, sessionId: payload.sessionId, reason: "HASH_MISMATCH" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      await this.authAuditService.logEvent({
        event: "REFRESH_FAILED",
        actorUserId: payload.sub,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        safeMeta: { userId: payload.sub, sessionId: payload.sessionId, reason: "USER_NOT_FOUND" },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    this.assertCanLogin(user.status);
    const safeUser = this.toSafeUser(user);
    const newSessionId = randomUUID();
    const finalTokens = await this.tokenService.generateTokenPair({
      userId: safeUser.id,
      email: safeUser.email,
      roles: safeUser.roles,
      sessionId: newSessionId,
    });

    const newSession = await this.sessionService.rotateSession({
      currentSession: session,
      newSessionId,
      refreshToken: finalTokens.refreshToken,
      expiresAt: this.tokenService.getRefreshExpiryDate(),
      meta,
    });

    await this.authAuditService.logEvent({
      event: "REFRESH_SUCCESS",
      actorUserId: safeUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: safeUser.id, sessionId: newSession.id },
    });

    return { user: safeUser, tokens: finalTokens };
  }

  async logout(dto: LogoutDto, meta?: RequestMeta) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
      const session = await this.sessionService.findSessionById(payload.sessionId);

      if (session && session.userId === payload.sub && !this.sessionService.isSessionRevoked(session)) {
        await this.sessionService.revokeSession({
          sessionId: session.id,
          reason: "LOGOUT",
        });
        await this.authAuditService.logEvent({
          event: "LOGOUT",
          actorUserId: payload.sub,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          safeMeta: { userId: payload.sub, sessionId: session.id },
        });
      }
    } catch {
      // Keep logout idempotent and non-disclosing for invalid/expired/revoked tokens.
    }

    return { success: true };
  }

  async logoutAll(currentUser: AuthUser, meta?: RequestMeta) {
    await this.sessionService.revokeAllUserSessions({
      userId: currentUser.id,
      reason: "LOGOUT_ALL",
    });
    await this.authAuditService.logEvent({
      event: "LOGOUT_ALL",
      actorUserId: currentUser.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      safeMeta: { userId: currentUser.id, sessionId: currentUser.sessionId },
    });

    return { success: true };
  }

  private assertCanLogin(status: UserStatus) {
    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED || status === UserStatus.DELETED) {
      throw new UnauthorizedException("Invalid credentials");
    }
  }

  private async issueSessionAndTokens(params: { user: SafeUserResponse; meta?: RequestMeta }) {
    const session = await this.sessionService.createSession({
      userId: params.user.id,
      meta: params.meta,
    });
    const tokens = await this.tokenService.generateTokenPair({
      userId: params.user.id,
      email: params.user.email,
      roles: params.user.roles,
      sessionId: session.id,
    });
    await this.sessionService.setRefreshToken(
      session.id,
      tokens.refreshToken,
      this.tokenService.getRefreshExpiryDate(),
    );
    return tokens;
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    status: UserStatus;
    createdAt: Date;
    profile: { displayName: string | null } | null;
    userRoles: Array<{ role: { code: string } }>;
  }): SafeUserResponse {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile ? { displayName: user.profile.displayName } : null,
      roles: user.userRoles.map((row) => row.role.code),
    };
  }
}
