import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'spliton-backend',
    };
  }

  constructor(private readonly prisma: PrismaService) {}

  async getDbHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
