import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(
      this.getRefreshCookieName(),
      refreshToken,
      this.getCookieOptions(REFRESH_MAX_AGE_MS),
    );
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(this.getRefreshCookieName(), this.getCookieOptions());
  }

  readRefreshTokenFromCookie(req: Request): string | null {
    const token = req.cookies?.[this.getRefreshCookieName()] as unknown;
    return typeof token === 'string' && token.trim() ? token : null;
  }

  shouldReturnRefreshTokenInBody(): boolean {
    return (
      this.configService.get<boolean>('AUTH_RETURN_REFRESH_TOKEN_IN_BODY') ??
      true
    );
  }

  private getRefreshCookieName(): string {
    return (
      this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME') ??
      'spliton_refresh_token'
    );
  }

  private getCookieOptions(maxAge?: number): CookieOptions {
    const sameSiteRaw = (
      this.configService.get<string>('AUTH_COOKIE_SAME_SITE') ?? 'lax'
    ).toLowerCase();
    const secure =
      this.configService.get<boolean>('AUTH_COOKIE_SECURE') ?? false;
    const domain =
      this.configService.get<string>('AUTH_COOKIE_DOMAIN')?.trim() || undefined;

    const sameSite: CookieOptions['sameSite'] =
      sameSiteRaw === 'strict'
        ? 'strict'
        : sameSiteRaw === 'none'
          ? 'none'
          : 'lax';

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/auth',
      ...(domain ? { domain } : {}),
      ...(maxAge ? { maxAge } : {}),
    };
  }
}
