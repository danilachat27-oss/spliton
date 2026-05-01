import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResendEmailVerificationDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getRequestMeta(req));
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getRequestMeta(req));
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto, this.getRequestMeta(req));
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto, @Req() req: Request) {
    return this.authService.logout(dto, this.getRequestMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.authService.logoutAll(user, this.getRequestMeta(req));
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

  private getRequestMeta(req: Request) {
    return {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
      device: req.get('x-device') ?? req.get('user-agent') ?? 'unknown',
    };
  }
}
