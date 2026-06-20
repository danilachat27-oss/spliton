import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ConfigurableThrottlerGuard } from './common/guards/configurable-throttler.guard';
import { RedisThrottlerStorage } from './common/throttle/redis-throttler.storage';
import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { AdminModule } from './modules/admin/admin.module';
import { AdminAuditModule } from './modules/admin/common/admin-audit.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MarketModule } from './modules/market/market.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReleasesModule } from './modules/releases/releases.module';
import { TradesModule } from './modules/trades/trades.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { SupportModule } from './modules/support/support.module';
import { NewsModule } from './modules/news/news.module';
import { StatusModule } from './modules/status/status.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { HelpCenterModule } from './modules/help-center/help-center.module';
import { DepositIngestionModule } from './modules/deposit-ingestion/deposit-ingestion.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { UserAnalyticsModule } from './modules/user-analytics/user-analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LegalModule } from './modules/legal/legal.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { ArtistModule } from './modules/artist/artist.module';
import { ReleaseDataRoomModule } from './modules/release-data-room/release-data-room.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { OperatorSlaModule } from './modules/operator-sla/operator-sla.module';
import { UserAccountingModule } from './modules/user-accounting/user-accounting.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { PlatformPublicModule } from './modules/platform/platform-public.module';
import { ServicesModule } from './modules/services/services.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { PlatformModule } from './common/platform/platform.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { RequestContextMiddleware } from './common/observability/request-context.middleware';
import { RequestLoggingInterceptor } from './common/observability/request-logging.interceptor';

@Module({
  imports: [
    ObservabilityModule,
    PlatformModule,
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const throttle = config.get<{
          ttlMs: number;
          limit: number;
        }>('throttle')!;
        const storageMode = (process.env.RATE_LIMIT_STORAGE ?? 'memory').trim().toLowerCase();
        const redisUrl = process.env.REDIS_URL?.trim();
        const useRedis = storageMode === 'redis' && Boolean(redisUrl);
        return {
          throttlers: [
            {
              ttl: throttle.ttlMs,
              limit: throttle.limit,
            },
          ],
          ...(useRedis ? { storage: new RedisThrottlerStorage(redisUrl!) } : {}),
        };
      },
    }),
    PrismaModule,
    AdminAuditModule,
    HealthModule,
    AdminModule,
    DocumentsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    ReleasesModule,
    WalletsModule,
    OrdersModule,
    MarketModule,
    TradesModule,
    SupportModule,
    NewsModule,
    StatusModule,
    AnnouncementsModule,
    HelpCenterModule,
    DepositIngestionModule,
    PortfolioModule,
    UserAnalyticsModule,
    NotificationsModule,
    LegalModule,
    TreasuryModule,
    ArtistModule,
    ReleaseDataRoomModule,
    DisputesModule,
    OperatorSlaModule,
    UserAccountingModule,
    OnboardingModule,
    ReferralsModule,
    PlatformPublicModule,
    ServicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ConfigurableThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
