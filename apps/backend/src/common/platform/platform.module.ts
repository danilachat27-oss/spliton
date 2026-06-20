import { Global, Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { ObservabilityModule } from '../observability/observability.module';
import { CacheInvalidationService } from './cache/cache-invalidation.service';
import { DataQualityService } from './data-quality/data-quality.service';
import { FeatureFlagsService } from './feature-flags/feature-flags.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { OutboxService } from './outbox/outbox.service';
import { RetentionCleanupService } from './retention/retention-cleanup.service';
import { SafetyConsoleService } from './safety/safety-console.service';
import { AdminSafetyController } from './safety/admin-safety.controller';

@Global()
@Module({
  imports: [CacheModule, ObservabilityModule],
  controllers: [AdminSafetyController],
  providers: [
    IdempotencyService,
    OutboxService,
    FeatureFlagsService,
    DataQualityService,
    CacheInvalidationService,
    RetentionCleanupService,
    SafetyConsoleService,
  ],
  exports: [
    IdempotencyService,
    OutboxService,
    FeatureFlagsService,
    DataQualityService,
    CacheInvalidationService,
    SafetyConsoleService,
  ],
})
export class PlatformModule {}
