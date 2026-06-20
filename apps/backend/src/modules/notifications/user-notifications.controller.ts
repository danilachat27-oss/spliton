import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { PatchNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationService } from './notification.service';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class UserNotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: NotificationListQueryDto) {
    return this.notifications.listForUser(
      user.id,
      user.roles ?? [],
      query.page,
      query.pageSize,
      { category: query.category, unreadOnly: query.unreadOnly },
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCountForUser(user.id, user.roles ?? []);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id, user.roles ?? []);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, user.roles ?? [], id);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.dismiss(user.id, user.roles ?? [], id);
  }
}

@Controller('api/v1/notification-preferences')
@UseGuards(JwtAuthGuard)
export class UserNotificationPreferencesController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.notifications.getOrCreatePreferences(user.id);
  }

  @Patch()
  patch(
    @CurrentUser() user: AuthUser,
    @Body() body: PatchNotificationPreferencesDto,
  ) {
    return this.notifications.updatePreferences(user.id, body);
  }
}
