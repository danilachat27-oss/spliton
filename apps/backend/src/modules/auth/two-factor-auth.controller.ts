import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  TwoFactorDisableDto,
  TwoFactorRegenerateRecoveryCodesDto,
  TwoFactorVerifyDto,
  TwoFactorVerifySetupDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthCookieService } from './services/auth-cookie.service';
import type { AuthResponse } from './types/auth-response.type';
import type { AuthUser } from './types/auth-user.type';

@Controller('auth/2fa')
export class TwoFactorAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  setup(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.authService.twoFactorSetup(user, this.meta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-setup')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifySetup(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorVerifySetupDto,
    @Req() req: Request,
  ) {
    return this.authService.twoFactorVerifySetup(user, dto, this.meta(req));
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verify(
    @Body() dto: TwoFactorVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.twoFactorVerify(
      dto,
      this.meta(req),
    );
    if (response.tokens.refreshToken) {
      this.authCookieService.setRefreshTokenCookie(
        res,
        response.tokens.refreshToken,
      );
    }
    if (this.authCookieService.shouldReturnRefreshTokenInBody()) {
      return response;
    }
    return {
      ...response,
      tokens: {
        accessToken: response.tokens.accessToken,
      },
    } satisfies AuthResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  disable(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorDisableDto,
    @Req() req: Request,
  ) {
    return this.authService.twoFactorDisable(user, dto, this.meta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes/regenerate')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  regenerateRecoveryCodes(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorRegenerateRecoveryCodesDto,
    @Req() req: Request,
  ) {
    return this.authService.twoFactorRegenerateRecoveryCodes(
      user,
      dto,
      this.meta(req),
    );
  }

  private meta(req: Request) {
    return {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
      device: req.get('x-device') ?? req.get('user-agent') ?? 'unknown',
    };
  }
}
