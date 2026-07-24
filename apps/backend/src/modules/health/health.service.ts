import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationsStatusService } from '../../common/observability/operations-status.service';

type HealthCheck = {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message?: string;
  latencyMs?: number;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: OperationsStatusService,
  ) {}

  getLive() {
    return {
      status: 'ok',
      service: 'spliton-backend',
      timestamp: new Date().toISOString(),
    };
  }

  /** @deprecated Use GET /health/live */
  getHealth() {
    return this.getLive();
  }

  async getReady() {
    const checks: HealthCheck[] = [];
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: 'database',
        status: 'ok',
        latencyMs: Date.now() - started,
      });
    } catch {
      checks.push({ name: 'database', status: 'fail', message: 'unreachable' });
    }

    checks.push(this.checkEnv('jwt', Boolean(process.env.JWT_SECRET)));
    checks.push(
      this.checkEnv('jwt_refresh', Boolean(process.env.JWT_REFRESH_SECRET)),
    );

    if (process.env.NODE_ENV === 'production') {
      const rateStorage = (process.env.RATE_LIMIT_STORAGE ?? 'memory')
        .trim()
        .toLowerCase();
      if (
        rateStorage === 'redis' ||
        process.env.RATE_LIMIT_MULTI_INSTANCE === 'true' ||
        process.env.RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION === 'true'
      ) {
        checks.push(
          this.checkEnv(
            'redis_url',
            Boolean(process.env.REDIS_URL?.trim()),
            'REDIS_URL required for redis-backed rate limits',
          ),
        );
        checks.push(
          this.checkEnv(
            'rate_limit_storage',
            rateStorage === 'redis',
            'RATE_LIMIT_STORAGE=redis required in production for 20k / multi-instance',
          ),
        );
      }
      const emailDeliveryOff =
        process.env.FEATURE_ENABLE_EMAIL_DELIVERY === 'false';
      const emailProvider = (process.env.EMAIL_PROVIDER ?? 'dev')
        .trim()
        .toLowerCase();
      checks.push(
        this.checkEnv(
          'email_provider',
          emailDeliveryOff ||
            emailProvider === 'postmark' ||
            emailProvider === 'resend',
          'postmark/resend required in production unless FEATURE_ENABLE_EMAIL_DELIVERY=false',
        ),
      );
      if (process.env.DEPOSIT_INGESTION_ENABLED === 'true') {
        checks.push(
          this.checkEnv(
            'tron_provider',
            process.env.TRON_PROVIDER_MODE === 'tron',
            'TRON_PROVIDER_MODE=tron required when ingestion enabled',
          ),
        );
      }
      if (process.env.REPORT_WORKER_ENABLED === 'true') {
        const mode = process.env.REPORT_STORAGE_MODE ?? 'db';
        const storageOk =
          mode === 'db' ||
          mode === 'local' ||
          (mode === 'supabase' &&
            Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));
        checks.push(
          storageOk
            ? { name: 'report_storage', status: 'ok' }
            : {
                name: 'report_storage',
                status: 'fail',
                message: 'report storage not configured',
              },
        );
      }
    }

    const failed = checks.filter((c) => c.status === 'fail');
    const payload = {
      status: failed.length ? 'fail' : 'ok',
      checks,
      timestamp: new Date().toISOString(),
    };
    if (failed.length) {
      throw new ServiceUnavailableException(payload);
    }
    return payload;
  }

  /** @deprecated Use GET /health/ready */
  async getDbHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  }

  async getDeep(token?: string) {
    const expected = process.env.HEALTH_DEEP_TOKEN?.trim();
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid health token');
    }

    const dbStarted = Date.now();
    let dbLatencyMs = 0;
    let migrationCount = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStarted;
      const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
      `;
      migrationCount = Number(rows[0]?.count ?? 0);
    } catch {
      dbLatencyMs = Date.now() - dbStarted;
    }

    const operations = await this.operations.getOverview();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: { latencyMs: dbLatencyMs, appliedMigrations: migrationCount },
      operations,
      errorTracking: {
        provider: process.env.ERROR_TRACKING_PROVIDER ?? 'console',
        configured: process.env.ERROR_TRACKING_PROVIDER !== 'disabled',
      },
    };
  }

  private checkEnv(name: string, ok: boolean, message?: string): HealthCheck {
    return ok
      ? { name, status: 'ok' }
      : { name, status: 'fail', message: message ?? 'missing' };
  }
}
