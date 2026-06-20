import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const slowMs = Number(process.env.PRISMA_SLOW_QUERY_MS ?? '0');
    super(
      slowMs > 0 ? { log: [{ emit: 'event', level: 'query' }] } : undefined,
    );
    if (slowMs > 0) {
      const client = this as PrismaClient & {
        $on?: (
          event: 'query',
          callback: (payload: { duration: number; query: string }) => void,
        ) => void;
      };
      client.$on?.('query', (event) => {
        if (event.duration >= slowMs) {
          this.logger.warn(
            `Slow query ${event.duration}ms: ${event.query.slice(0, 240)}`,
          );
        }
      });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
