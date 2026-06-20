import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthCookieService } from './services/auth-cookie.service';
import type { AuthUser } from './types/auth-user.type';
import type { AuthResponse } from './types/auth-response.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getRequestMeta(req));
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.getRequestMeta(req));
    if ('tokens' in result) {
      if (result.tokens.refreshToken) {
        this.authCookieService.setRefreshTokenCookie(
          res,
          result.tokens.refreshToken,
        );
      }
      return this.normalizeAuthResponse(result);
    }
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.resolveRefreshToken(req, dto.refreshToken);
    const result = await this.authService.refresh(
      { refreshToken },
      this.getRequestMeta(req),
    );
    if (result.tokens.refreshToken) {
      this.authCookieService.setRefreshTokenCookie(
        res,
        result.tokens.refreshToken,
      );
    }
    return this.normalizeAuthResponse(result);
  }

  @Post('logout')
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.resolveRefreshToken(req, dto.refreshToken, true);
    const response = await this.authService.logout(
      { refreshToken },
      this.getRequestMeta(req),
    );
    this.authCookieService.clearRefreshTokenCookie(res);
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.logoutAll(
      user,
      this.getRequestMeta(req),
    );
    this.authCookieService.clearRefreshTokenCookie(res);
    return response;
  }

  @Post('email/verify')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto, this.getRequestMeta(req));
  }

  @Post('email/resend')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resendEmail(@Body() dto: ResendEmailVerificationDto, @Req() req: Request) {
    return this.authService.resendEmailVerification(
      dto,
      this.getRequestMeta(req),
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, this.getRequestMeta(req));
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, this.getRequestMeta(req));
  }

  private getRequestMeta(req: Request) {
    return {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
      device: req.get('x-device') ?? req.get('user-agent') ?? 'unknown',
    };
  }

  private resolveRefreshToken(
    req: Request,
    bodyRefreshToken?: string,
    allowMissing = false,
  ): string {
    const cookieToken = this.authCookieService.readRefreshTokenFromCookie(req);
    if (cookieToken) {
      return cookieToken;
    }

    if (
      bodyRefreshToken &&
      this.authCookieService.shouldReturnRefreshTokenInBody()
    ) {
      return bodyRefreshToken;
    }

    if (allowMissing) {
      return '';
    }

    return '';
  }

  private normalizeAuthResponse(response: AuthResponse): AuthResponse {
    if (this.authCookieService.shouldReturnRefreshTokenInBody()) {
      return response;
    }
    return {
      ...response,
      tokens: {
        accessToken: response.tokens.accessToken,
      },
    };
  }
}
