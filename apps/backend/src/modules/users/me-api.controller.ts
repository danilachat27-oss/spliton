import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { requestMeta } from '../admin/common/admin-http.util';
import { UsersService } from './users.service';
import { UserPasswordService } from './user-password.service';
import { UserSecurityPreferencesService } from './user-security-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PatchSecurityPreferencesDto } from './dto/patch-security-preferences.dto';

/** Alias routes under `/api/v1/me` (canonical for mobile/API clients). */
@Controller('api/v1/me')
@UseGuards(JwtAuthGuard)
export class MeApiController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPassword: UserPasswordService,
    private readonly securityPreferences: UserSecurityPreferencesService,
  ) {}

  @Get()
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id, user.roles ?? []);
  }

  @Get('account-center')
  getAccountCenter(@CurrentUser() user: AuthUser) {
    return this.usersService.getAccountCenter(user.id, user.roles ?? []);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: AuthUser, @Body() body: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.id, body);
  }

  @Patch('password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.userPassword.changePassword({
      userId: user.id,
      sessionId: user.sessionId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      meta: requestMeta(req),
    });
  }

  @Get('security-preferences')
  getSecurityPreferences(@CurrentUser() user: AuthUser) {
    return this.securityPreferences.getOrCreate(user.id);
  }

  @Patch('security-preferences')
  patchSecurityPreferences(
    @CurrentUser() user: AuthUser,
    @Body() body: PatchSecurityPreferencesDto,
  ) {
    return this.securityPreferences.patch(user.id, body);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: AuthUser) {
    return this.usersService.listSessions(user.id);
  }

  @Delete('sessions/:id')
  revokeSession(@CurrentUser() user: AuthUser, @Param('id') sessionId: string) {
    return this.usersService.revokeSession(user.id, sessionId);
  }

  @Post('logout-all')
  logoutAll(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.usersService.logoutAllSessions(user.id, user.sessionId, requestMeta(req));
  }

  @Get('security-events')
  securityEvents(@CurrentUser() user: AuthUser) {
    return this.usersService.listSecurityEvents(user.id);
  }
}
