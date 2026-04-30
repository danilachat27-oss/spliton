import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokens } from '../types/auth-response.type';
import { TokenPayload } from '../types/token-payload.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokenPair(params: {
    userId: string;
    email: string;
    roles: string[];
    sessionId: string;
  }): Promise<AuthTokens> {
    const accessPayload: TokenPayload = {
      sub: params.userId,
      email: params.email,
      roles: params.roles,
      sessionId: params.sessionId,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      sub: params.userId,
      email: params.email,
      roles: params.roles,
      sessionId: params.sessionId,
      type: 'refresh',
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'Refresh secret is not configured',
      );
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '15m' }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'Refresh secret is not configured',
      );
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  getRefreshExpiryDate(): Date {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + sevenDaysMs);
  }
}
