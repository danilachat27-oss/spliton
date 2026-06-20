import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { requestMeta } from '../admin/common/admin-http.util';

import { UsersService } from './users.service';
import { UserPasswordService } from './user-password.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPassword: UserPasswordService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id, user.roles ?? []);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  updatePreferences(@CurrentUser() user: AuthUser, @Body() body: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
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
}
