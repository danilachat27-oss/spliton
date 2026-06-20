import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

@Injectable()
export class ConfigurableThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const throttle = this.configService.get<{
      enabled: boolean;
      loadTestMode: boolean;
    }>('throttle');
    const nodeEnv = this.configService.get<string>('app.nodeEnv', 'development');

    if (!throttle?.enabled) {
      return true;
    }
    // E2E runs with NODE_ENV=test — optional bypass (never in production).
    if (
      nodeEnv === 'test' &&
      (process.env.E2E_BYPASS_THROTTLE === 'true' ||
        process.env.E2E_BYPASS_THROTTLE === '1')
    ) {
      return true;
    }
    // Load-test bypass applies only to dev/staging runtime — never in production or e2e (NODE_ENV=test).
    if (throttle.loadTestMode && nodeEnv !== 'production' && nodeEnv !== 'test') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
