import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificationAudienceType, NotificationSeverity } from '@prisma/client';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { NotificationService } from './notification.service';

class AdminNotificationListQueryDto extends NotificationListQueryDto {
  @IsOptional()
  @IsString()
  severity?: string;
}

class AdminBroadcastDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  recipientRoleCode?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller('api/admin/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  private staffRoles(user: AuthUser) {
    return (user.roles ?? []).filter((r) =>
      (ADMIN_PANEL_ROLE_CODES as readonly string[]).includes(r),
    );
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminNotificationListQueryDto,
  ) {
    return this.notifications.listForAdmin(
      this.staffRoles(user),
      user.id,
      query.page,
      query.pageSize,
      {
        category: query.category,
        unreadOnly: query.unreadOnly,
        severity: query.severity,
      },
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCountForAdmin(this.staffRoles(user));
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id, this.staffRoles(user));
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, this.staffRoles(user), id);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.dismiss(user.id, this.staffRoles(user), id);
  }

  @Post('broadcast')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async broadcast(
    @CurrentUser() user: AuthUser,
    @Body() body: AdminBroadcastDto,
  ) {
    const audience = NotificationAudienceType.ROLE;
    const row = await this.notifications.create({
      audience,
      recipientRoleCode: body.recipientRoleCode,
      type: 'admin.broadcast',
      category: body.category ?? 'system',
      severity: NotificationSeverity.WARNING,
      title: body.title,
      message: body.message,
      idempotencyKey: `broadcast:${user.id}:${Date.now()}`,
      metadata: { actorUserId: user.id },
    });
    return { ok: true, notification: row };
  }
}
