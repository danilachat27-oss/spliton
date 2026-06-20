import { Injectable } from '@nestjs/common';
import { ReleaseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_CATALOG_STATUSES: ReleaseStatus[] = [
  ReleaseStatus.ACTIVE,
  ReleaseStatus.SOLD_OUT,
];

@Injectable()
export class ReleasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.release.findMany({
      where: {
        deletedAt: null,
        status: { in: PUBLIC_CATALOG_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
