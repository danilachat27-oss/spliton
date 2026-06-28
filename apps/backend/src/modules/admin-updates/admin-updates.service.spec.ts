import { Test, TestingModule } from '@nestjs/testing';
import {
  AdminUpdateStatus,
  AdminUpdateType,
  UserRoleCode,
} from '@prisma/client';
import { AdminUpdatesService } from './admin-updates.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminUpdatesService', () => {
  const prisma = {
    adminUpdateAnnouncement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    adminUpdateRead: {
      upsert: jest.fn(),
    },
  };

  let service: AdminUpdatesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUpdatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AdminUpdatesService);
  });

  const publishedRow = {
    id: 'u1',
    title: 'Test',
    summary: 'Summary',
    content: 'Body',
    type: AdminUpdateType.FEATURE,
    status: AdminUpdateStatus.PUBLISHED,
    audienceRoles: [UserRoleCode.ADMIN],
    publishedAt: new Date('2026-06-27'),
    createdAt: new Date('2026-06-27'),
    updatedAt: new Date('2026-06-27'),
    reads: [] as Array<{ readAt: Date | null; dismissedAt: Date | null }>,
  };

  it('returns published update for allowed role when not dismissed', async () => {
    prisma.adminUpdateAnnouncement.findMany.mockResolvedValue([publishedRow]);
    const result = await service.listActive('admin-1', [UserRoleCode.ADMIN]);
    expect(result.primary?.id).toBe('u1');
    expect(result.remainingCount).toBe(0);
  });

  it('excludes dismissed updates from active', async () => {
    prisma.adminUpdateAnnouncement.findMany.mockResolvedValue([
      {
        ...publishedRow,
        reads: [{ readAt: new Date(), dismissedAt: new Date() }],
      },
    ]);
    const result = await service.listActive('admin-1', [UserRoleCode.ADMIN]);
    expect(result.primary).toBeNull();
  });

  it('keeps dismissed update in history', async () => {
    prisma.adminUpdateAnnouncement.findMany.mockResolvedValue([
      {
        ...publishedRow,
        reads: [{ readAt: new Date(), dismissedAt: new Date() }],
      },
    ]);
    const history = await service.listHistory('admin-1', [UserRoleCode.ADMIN]);
    expect(history).toHaveLength(1);
    expect(history[0].isDismissed).toBe(true);
  });

  it('seed is idempotent', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue({ id: 'x' });
    await expect(service.seedLegalCmsUpdateIfMissing()).resolves.toBe('skipped');
    expect(prisma.adminUpdateAnnouncement.create).not.toHaveBeenCalled();
  });

  it('does not return draft updates in active list', async () => {
    prisma.adminUpdateAnnouncement.findMany.mockResolvedValue([]);
    const result = await service.listActive('admin-1', [UserRoleCode.ADMIN]);
    expect(result.primary).toBeNull();
    expect(prisma.adminUpdateAnnouncement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: AdminUpdateStatus.PUBLISHED },
      }),
    );
  });

  it('creates seed when legal cms update is missing', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue(null);
    prisma.adminUpdateAnnouncement.create.mockResolvedValue({ id: 'seed-1' });
    await expect(service.seedLegalCmsUpdateIfMissing()).resolves.toBe('created');
    expect(prisma.adminUpdateAnnouncement.create).toHaveBeenCalled();
  });

  it('public EN localization seed is idempotent', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue({ id: 'x' });
    await expect(service.seedPublicEnLocalizationUpdateIfMissing()).resolves.toBe('skipped');
    expect(prisma.adminUpdateAnnouncement.create).not.toHaveBeenCalled();
  });

  it('creates public EN localization seed when missing', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue(null);
    prisma.adminUpdateAnnouncement.create.mockResolvedValue({ id: 'seed-2' });
    await expect(service.seedPublicEnLocalizationUpdateIfMissing()).resolves.toBe('created');
    expect(prisma.adminUpdateAnnouncement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: AdminUpdateType.UX,
          status: AdminUpdateStatus.PUBLISHED,
        }),
      }),
    );
  });

  it('creates calculator units seed when missing', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue(null);
    prisma.adminUpdateAnnouncement.create.mockResolvedValue({ id: 'seed-calc' });
    await expect(service.seedCalculatorUnitsUpdateIfMissing()).resolves.toBe('created');
    expect(prisma.adminUpdateAnnouncement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: AdminUpdateType.FEATURE,
          status: AdminUpdateStatus.PUBLISHED,
        }),
      }),
    );
  });

  it('calculator units seed is idempotent', async () => {
    prisma.adminUpdateAnnouncement.findFirst.mockResolvedValue({ id: 'x' });
    await expect(service.seedCalculatorUnitsUpdateIfMissing()).resolves.toBe('skipped');
    expect(prisma.adminUpdateAnnouncement.create).not.toHaveBeenCalled();
  });
});
