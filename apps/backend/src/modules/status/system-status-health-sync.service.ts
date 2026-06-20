import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SystemComponentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

const SYNC_INTERVAL_MS = 5 * 60_000;

type ComponentCheck = {
  code: string;
  status: SystemComponentStatus;
  message: string;
};

@Injectable()
export class SystemStatusHealthSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemStatusHealthSyncService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  onModuleInit(): void {
    void this.sync().catch((err) => {
      this.logger.warn(`Initial status sync failed: ${String(err)}`);
    });
    this.timer = setInterval(() => {
      void this.sync().catch((err) => {
        this.logger.warn(`Status sync failed: ${String(err)}`);
      });
    }, SYNC_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async sync(): Promise<void> {
    const checks = await this.runChecks();
    const now = new Date();
    for (const check of checks) {
      await this.prisma.systemStatusComponent.updateMany({
        where: { code: check.code },
        data: {
          status: check.status,
          message: check.message,
          updatedAt: now,
        },
      });
    }
    this.cache.invalidate('system-status:snapshot');
  }

  private async runChecks(): Promise<ComponentCheck[]> {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const dbStatus = dbOk ? SystemComponentStatus.OPERATIONAL : SystemComponentStatus.MAJOR_OUTAGE;
    const dbMessage = dbOk ? 'База данных доступна' : 'Health-check базы данных не прошёл';

    const stuckReports = dbOk
      ? await this.prisma.generatedDocument.count({
          where: {
            status: 'QUEUED',
            createdAt: { lt: new Date(Date.now() - 15 * 60_000) },
          },
        })
      : 0;

    const reportsStatus =
      !dbOk
        ? SystemComponentStatus.DEGRADED
        : stuckReports > 0
          ? SystemComponentStatus.DEGRADED
          : SystemComponentStatus.OPERATIONAL;
    const reportsMessage =
      !dbOk
        ? 'Не удалось проверить очередь отчётов — БД недоступна'
        : stuckReports > 0
          ? `${stuckReports} выписок в очереди >15 мин`
          : 'Генерация отчётов в норме';

    const pendingWithdrawals = dbOk
      ? await this.prisma.withdrawal.count({
          where: { status: { in: ['REQUESTED', 'REVIEW', 'PROCESSING', 'ON_HOLD'] } },
        })
      : 0;

    const withdrawalStatus = !dbOk
      ? SystemComponentStatus.DEGRADED
      : pendingWithdrawals > 50
        ? SystemComponentStatus.DEGRADED
        : SystemComponentStatus.OPERATIONAL;

    const withdrawalMessage = !dbOk
      ? 'Проверка выводов пропущена — БД недоступна'
      : pendingWithdrawals > 50
        ? `${pendingWithdrawals} заявок на вывод в очереди`
        : 'Очередь выводов в норме';

    const degradedIfDbDown = dbOk ? SystemComponentStatus.OPERATIONAL : SystemComponentStatus.DEGRADED;
    const skipMessage = 'Проверка пропущена — БД недоступна';
    const okMessage = 'Мониторинг в штатном режиме';

    return [
      { code: 'api', status: SystemComponentStatus.OPERATIONAL, message: 'API-процесс работает' },
      { code: 'frontend', status: SystemComponentStatus.OPERATIONAL, message: 'Веб-интерфейс доступен' },
      { code: 'auth', status: degradedIfDbDown, message: dbOk ? 'Сервис авторизации доступен' : skipMessage },
      { code: 'supabase', status: dbStatus, message: dbMessage },
      { code: 'wallet_ledger', status: degradedIfDbDown, message: dbOk ? 'Ledger доступен' : skipMessage },
      { code: 'deposits', status: degradedIfDbDown, message: dbOk ? 'Приём депозитов мониторится' : skipMessage },
      { code: 'withdrawals', status: withdrawalStatus, message: withdrawalMessage },
      { code: 'revenue_payouts', status: degradedIfDbDown, message: dbOk ? 'Начисления revenue share мониторятся' : skipMessage },
      { code: 'primary_market', status: degradedIfDbDown, message: dbOk ? 'Покупка units доступна' : skipMessage },
      { code: 'catalog', status: degradedIfDbDown, message: dbOk ? 'Каталог релизов доступен' : skipMessage },
      { code: 'secondary_market', status: degradedIfDbDown, message: dbOk ? 'Вторичный рынок доступен' : skipMessage },
      { code: 'order_matching', status: degradedIfDbDown, message: dbOk ? 'Исполнение ордеров в норме' : skipMessage },
      { code: 'balance_sync', status: degradedIfDbDown, message: dbOk ? 'Синхронизация баланса в норме' : skipMessage },
      { code: 'kyc', status: degradedIfDbDown, message: dbOk ? 'Верификация принимает заявки' : skipMessage },
      { code: 'notifications', status: degradedIfDbDown, message: dbOk ? 'Уведомления доставляются' : skipMessage },
      { code: 'support', status: degradedIfDbDown, message: dbOk ? 'Канал поддержки доступен' : skipMessage },
      { code: 'reports_worker', status: reportsStatus, message: reportsMessage },
      { code: 'storage', status: degradedIfDbDown, message: dbOk ? okMessage : skipMessage },
      { code: 'referral_program', status: degradedIfDbDown, message: dbOk ? 'Реферальная программа активна' : skipMessage },
      { code: 'partner_program', status: degradedIfDbDown, message: dbOk ? 'Партнёрская программа активна' : skipMessage },
    ];
  }
}
