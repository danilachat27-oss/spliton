import { Module } from '@nestjs/common';
import { OutboxWorker } from '../../common/platform/outbox/outbox.worker';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationEventsService } from './notification-events.service';
import { NotificationService } from './notification.service';
import {
  UserNotificationPreferencesController,
  UserNotificationsController,
} from './user-notifications.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [
    UserNotificationsController,
    UserNotificationPreferencesController,
    AdminNotificationsController,
  ],
  providers: [NotificationService, NotificationEventsService, OutboxWorker],
  exports: [NotificationService, NotificationEventsService],
})
export class NotificationsModule {}
