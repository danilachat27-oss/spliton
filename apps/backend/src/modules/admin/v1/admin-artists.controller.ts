import {

  Body,

  Controller,

  Delete,

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

import { AdminArtistsService } from './admin-artists.service';
import { requestMeta } from '../common/admin-http.util';



@Controller('api/admin/v1/artists')

@UseGuards(JwtAuthGuard, RolesGuard)

@Roles(...ADMIN_PANEL_ROLE_CODES)

export class AdminArtistsController {

  constructor(private readonly artists: AdminArtistsService) {}



  @Get()

  list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {

    return this.artists.list(user.roles, search);

  }



  @Get(':id')

  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {

    return this.artists.getById(user.roles, id);

  }



  @Post()

  create(

    @CurrentUser() user: AuthUser,

    @Body() body: { name: string; slug?: string },

    @Req() req: Request,

  ) {

    return this.artists.create(user.id, user.roles, body, requestMeta(req));

  }



  @Patch(':id')

  update(

    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: { name?: string; slug?: string; isActive?: boolean },

    @Req() req: Request,

  ) {

    return this.artists.update(user.id, user.roles, id, body, requestMeta(req));

  }



  @Delete(':id')

  remove(@CurrentUser() user: AuthUser, @Param('id') id: string, @Req() req: Request) {

    return this.artists.remove(user.id, user.roles, id, requestMeta(req));

  }

}


