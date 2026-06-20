import { Injectable } from '@nestjs/common';
import { NotificationSeverity, UserRoleCode } from '@prisma/client';
import { OutboxService } from '../../common/platform/outbox/outbox.service';
import { OutboxEventTypes } from '../../common/platform/outbox/outbox.types';
import { NotificationService } from './notification.service';
import type { CreateNotificationInput } from './notification.service';

@Injectable()
export class NotificationEventsService {
  constructor(
    private readonly notifications: NotificationService,
    private readonly outbox: OutboxService,
  ) {}

  private async enqueueUser(
    userId: string,
    input: Omit<CreateNotificationInput, 'audience' | 'recipientUserId'>,
    idempotencyKey: string,
  ) {
    await this.outbox.enqueue({
      eventType: OutboxEventTypes.NOTIFICATION_USER,
      idempotencyKey,
      payload: { userId, input },
    });
  }

  private async enqueueAdminRoles(
    roleCodes: UserRoleCode[],
    input: Omit<
      CreateNotificationInput,
      'audience' | 'recipientRoleCode' | 'recipientUserId'
    >,
    idempotencyKey: string,
  ) {
    await this.outbox.enqueue({
      eventType: OutboxEventTypes.NOTIFICATION_ADMIN_ROLES,
      idempotencyKey,
      payload: { roleCodes, input },
    });
  }

  async depositCredited(input: {
    userId: string;
    depositId: string;
    amount: string;
  }) {
    await this.enqueueUser(
      input.userId,
      {
        type: 'deposit.credited',
        category: 'finance',
        severity: NotificationSeverity.INFO,
        title: 'Депозит зачислен',
        message: `На кошелёк зачислено ${input.amount} USDT.`,
        actionUrl: '/assets/activity',
        relatedEntityType: 'deposit',
        relatedEntityId: input.depositId,
        idempotencyKey: `deposit-credited:${input.depositId}`,
        sendEmail: true,
      },
      `deposit-credited:${input.depositId}`,
    );
    await this.enqueueAdminRoles(
      [UserRoleCode.ACCOUNTANT, UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN],
      {
        type: 'admin.deposit.credited',
        category: 'finance',
        severity: NotificationSeverity.INFO,
        title: 'Депозит зачислен',
        message: `Автозачисление депозита ${input.depositId.slice(0, 8)}…`,
        actionUrl: `/admin/deposits?highlight=${input.depositId}`,
        relatedEntityType: 'deposit',
        relatedEntityId: input.depositId,
        idempotencyKey: `admin-deposit-credited:${input.depositId}`,
      },
      `admin-deposit-credited:${input.depositId}`,
    );
  }

  async withdrawalRequested(input: {
    userId: string;
    withdrawalId: string;
    amount: string;
  }) {
    await this.enqueueUser(
      input.userId,
      {
      type: 'withdrawal.requested',
      category: 'finance',
      severity: NotificationSeverity.INFO,
      title: 'Заявка на вывод создана',
      message: `Запрошен вывод ${input.amount} USDT. Статус можно отслеживать в кошельке.`,
      actionUrl: '/assets/activity',
      relatedEntityType: 'withdrawal',
      relatedEntityId: input.withdrawalId,
      idempotencyKey: `withdrawal-requested:${input.withdrawalId}`,
      sendEmail: true,
      },
      `withdrawal-requested:${input.withdrawalId}`,
    );
    await this.enqueueAdminRoles(
      [
        UserRoleCode.ACCOUNTANT,
        UserRoleCode.COMPLIANCE,
        UserRoleCode.ADMIN,
        UserRoleCode.SUPER_ADMIN,
      ],
      {
        type: 'admin.withdrawal.requested',
        category: 'finance',
        severity: NotificationSeverity.WARNING,
        title: 'Новая заявка на вывод',
        message: `Пользователь запросил вывод ${input.amount} USDT.`,
        actionUrl: `/admin/withdrawals?status=requested`,
        relatedEntityType: 'withdrawal',
        relatedEntityId: input.withdrawalId,
        idempotencyKey: `admin-withdrawal-requested:${input.withdrawalId}`,
        priority: 10,
      },
      `admin-withdrawal-requested:${input.withdrawalId}`,
    );
  }

  async primaryPurchaseSettled(input: {
    userId: string;
    orderId: string;
    releaseTitle: string;
    units: string;
  }) {
    await this.enqueueUser(
      input.userId,
      {
      type: 'primary.purchase.settled',
      category: 'market',
      severity: NotificationSeverity.INFO,
      title: 'Покупка на первичном рынке',
      message: `Вы приобрели ${input.units} UNT по релизу «${input.releaseTitle}».`,
      actionUrl: '/assets/positions',
      relatedEntityType: 'order',
      relatedEntityId: input.orderId,
      idempotencyKey: `primary-settled:${input.orderId}`,
      },
      `primary-settled:${input.orderId}`,
    );
  }

  async secondaryTradeExecuted(input: {
    tradeId: string;
    buyerUserId: string;
    sellerUserId: string;
    releaseTitle: string;
    units: string;
    grossAmount: string;
  }) {
    await this.enqueueUser(
      input.buyerUserId,
      {
      type: 'secondary.trade.buy',
      category: 'market',
      severity: NotificationSeverity.INFO,
      title: 'Сделка на вторичном рынке',
      message: `Покупка ${input.units} UNT («${input.releaseTitle}») на сумму ${input.grossAmount} USDT.`,
      actionUrl: '/dashboard/secondary-market',
      relatedEntityType: 'trade',
      relatedEntityId: input.tradeId,
      idempotencyKey: `secondary-buy:${input.tradeId}`,
      },
      `secondary-buy:${input.tradeId}`,
    );
    await this.enqueueUser(
      input.sellerUserId,
      {
      type: 'secondary.trade.sell',
      category: 'market',
      severity: NotificationSeverity.INFO,
      title: 'Листинг продан',
      message: `Продано ${input.units} UNT («${input.releaseTitle}»).`,
      actionUrl: '/dashboard/secondary-market',
      relatedEntityType: 'trade',
      relatedEntityId: input.tradeId,
      idempotencyKey: `secondary-sell:${input.tradeId}`,
      },
      `secondary-sell:${input.tradeId}`,
    );
  }

  async supportStaffReplied(input: {
    userId: string;
    ticketId: string;
    subject: string;
  }) {
    await this.notifications.notifyUser(input.userId, {
      type: 'support.replied',
      category: 'support',
      severity: NotificationSeverity.INFO,
      title: 'Ответ службы поддержки',
      message: `Новый ответ по обращению «${input.subject}».`,
      actionUrl: `/dashboard/support/${input.ticketId}`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: input.ticketId,
      idempotencyKey: `support-reply:${input.ticketId}:${Date.now()}`,
      sendEmail: true,
    });
  }

  async newsPublishedImportant(input: {
    postId: string;
    title: string;
    slug: string;
  }) {
    await this.notifications.notifyAdminRoles(
      [UserRoleCode.NEWS_MANAGER, UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN],
      {
        type: 'admin.news.published',
        category: 'news',
        severity: NotificationSeverity.INFO,
        title: 'Новость опубликована',
        message: `«${input.title}» опубликована на платформе.`,
        actionUrl: '/admin/news',
        relatedEntityType: 'news_post',
        relatedEntityId: input.postId,
        idempotencyKey: `admin-news-published:${input.postId}`,
      },
    );
  }

  async systemIncidentCreated(input: {
    incidentId: string;
    title: string;
    severity: NotificationSeverity;
  }) {
    await this.notifications.notifyAdminRoles(
      [
        UserRoleCode.ADMIN,
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.SUPPORT_MANAGER,
      ],
      {
        type: 'admin.incident.created',
        category: 'system',
        severity: input.severity,
        title: 'Инцидент системы',
        message: input.title,
        actionUrl: '/admin/system-status',
        relatedEntityType: 'status_incident',
        relatedEntityId: input.incidentId,
        idempotencyKey: `admin-incident:${input.incidentId}`,
        priority: 20,
      },
    );
  }

  async reportJobFailed(input: {
    jobId: string;
    reportType: string;
  }) {
    await this.enqueueAdminRoles(
      [UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN, UserRoleCode.ACCOUNTANT],
      {
        type: 'admin.report.failed',
        category: 'reports',
        severity: NotificationSeverity.CRITICAL,
        title: 'Ошибка формирования отчёта',
        message: `Отчёт ${input.reportType} (${input.jobId.slice(0, 8)}…) не создан.`,
        actionUrl: '/admin/reports',
        relatedEntityType: 'report_job',
        relatedEntityId: input.jobId,
        idempotencyKey: `admin-report-failed:${input.jobId}`,
        priority: 15,
      },
      `admin-report-failed:${input.jobId}`,
    );
  }

  async passwordChanged(userId: string) {
    await this.notifications.notifyUser(userId, {
      type: 'security.password_changed',
      category: 'security',
      severity: NotificationSeverity.WARNING,
      title: 'Пароль изменён',
      message:
        'Пароль вашего аккаунта Spliton был изменён. Если это были не вы — немедленно обратитесь в поддержку.',
      actionUrl: '/dashboard/profile',
      idempotencyKey: `password-changed:${userId}:${Math.floor(Date.now() / 60000)}`,
      sendEmail: true,
    });
  }
}
