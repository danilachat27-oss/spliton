import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
import { SessionService } from '../services/session.service';
import { AuthUser } from '../types/auth-user.type';
import { TokenPayload } from '../types/token-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly sessionService: SessionService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: TokenPayload): Promise<AuthUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      user.status === UserStatus.PENDING_EMAIL_VERIFICATION ||
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.DELETED
    ) {
      throw new UnauthorizedException('User is not active');
    }

    const session = await this.sessionService.findSessionById(
      payload.sessionId,
    );
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Session not found');
    }

    if (
      this.sessionService.isSessionRevoked(session) ||
      this.sessionService.isSessionExpired(session)
    ) {
      throw new UnauthorizedException('Session is not active');
    }

    await this.sessionService.touchSession(session.id);

    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((item) => item.role.code),
      sessionId: session.id,
    };
  }
}
