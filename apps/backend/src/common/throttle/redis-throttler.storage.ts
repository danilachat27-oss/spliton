import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis throttle connection error: ${err.message}`);
    });
  }

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
    const hits = await this.client.incr(key);
    if (hits === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    const timeToExpire = await this.client.ttl(key);
    return {
      totalHits: hits,
      timeToExpire: Math.max(timeToExpire, 0) * 1000,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
