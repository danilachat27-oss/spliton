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
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { requestMeta } from '../common/admin-http.util';
import { AdminSupportService } from './admin-support.service';

class PatchTicketStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class AssignTicketDto {
  @IsOptional()
  @IsString()
  assigneeUserId?: string | null;
}

class AddTicketNoteDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

class ReplyTicketDto {
  @IsString()
  body!: string;
}

class PatchPriorityDto {
  @IsString()
  priority!: string;
}

class EscalateTicketDto {
  @IsString()
  target!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('api/admin/v1/support/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSupportController {
  constructor(private readonly support: AdminSupportService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.support.summary(user.roles);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.support.list(user.roles, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.support.getById(user.roles, id);
  }

  @Post(':id/take')
  take(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.support.take(user.id, user.roles, id, requestMeta(req));
  }

  @Patch(':id/status')
  patchStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchTicketStatusDto,
    @Req() req: Request,
  ) {
    return this.support.patchStatus(
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
    @Body() body: PatchPriorityDto,
    @Req() req: Request,
  ) {
    return this.support.patchPriority(
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
    @Body() body: AssignTicketDto,
    @Req() req: Request,
  ) {
    return this.support.assign(
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
    @Body() body: ReplyTicketDto,
    @Req() req: Request,
  ) {
    return this.support.reply(
      user.id,
      user.roles,
      id,
      body.body,
      requestMeta(req),
    );
  }

  @Post(':id/escalate')
  escalate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: EscalateTicketDto,
    @Req() req: Request,
  ) {
    return this.support.escalate(
      user.id,
      user.roles,
      id,
      body.target,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/reopen')
  reopen(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.support.reopen(user.id, user.roles, id, requestMeta(req));
  }

  @Post(':id/notes')
  addNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AddTicketNoteDto,
    @Req() req: Request,
  ) {
    return this.support.addNote(
      user.id,
      user.roles,
      id,
      body.body,
      body.isInternal ?? true,
      requestMeta(req),
    );
  }
}
