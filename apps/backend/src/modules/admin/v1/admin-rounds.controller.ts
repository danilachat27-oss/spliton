import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { requestMeta } from '../common/admin-http.util';
import { AdminRoundsService } from './admin-rounds.service';

@Controller('api/admin/v1/rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminRoundsController {
  constructor(private readonly rounds: AdminRoundsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.rounds.list(user.roles, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.rounds.getById(user.roles, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.rounds.create(user.id, user.roles, body, requestMeta(req));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.rounds.update(user.id, user.roles, id, body, requestMeta(req));
  }

  @Post(':id/publish')
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.rounds.transitionStatus(
      user.id,
      user.roles,
      id,
      'publish',
      requestMeta(req),
    );
  }

  @Post(':id/pause')
  pause(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.rounds.transitionStatus(
      user.id,
      user.roles,
      id,
      'pause',
      requestMeta(req),
    );
  }

  @Post(':id/close')
  close(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.rounds.transitionStatus(
      user.id,
      user.roles,
      id,
      'close',
      requestMeta(req),
    );
  }
}
