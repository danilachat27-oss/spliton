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
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { requestMeta } from '../common/admin-http.util';
import { AdminDisputesService } from './admin-disputes.service';

class PatchDisputeStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class AssignDisputeDto {
  @IsOptional()
  @IsString()
  assigneeUserId?: string | null;
}

class ReplyDisputeDto {
  @IsString()
  body!: string;
}

class AddDisputeNoteDto {
  @IsString()
  body!: string;
}

class PatchDisputePriorityDto {
  @IsString()
  priority!: string;
}

@Controller('api/admin/v1/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.disputes.summary(user.roles);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.disputes.list(user.roles, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.disputes.getById(user.roles, id);
  }

  @Patch(':id/status')
  patchStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchDisputeStatusDto,
    @Req() req: Request,
  ) {
    return this.disputes.patchStatus(
      user.id,
      user.roles,
      id,
      body.status,
      body.note,
      requestMeta(req),
    );
  }

  @Patch(':id/priority')
  patchPriority(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchDisputePriorityDto,
    @Req() req: Request,
  ) {
    return this.disputes.patchPriority(
      user.id,
      user.roles,
      id,
      body.priority,
      requestMeta(req),
    );
  }

  @Patch(':id/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AssignDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputes.assign(
      user.id,
      user.roles,
      id,
      body.assigneeUserId ?? null,
      requestMeta(req),
    );
  }

  @Post(':id/reply')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: ReplyDisputeDto,
    @Req() req: Request,
  ) {
    return this.disputes.reply(user.id, user.roles, id, body.body, requestMeta(req));
  }

  @Post(':id/notes')
  addNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddDisputeNoteDto,
    @Req() req: Request,
  ) {
    return this.disputes.addNote(user.id, user.roles, id, body.body, requestMeta(req));
  }
}
