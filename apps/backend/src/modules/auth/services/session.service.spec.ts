import type { UserSession } from '@prisma/client';
import { SessionService } from './session.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('SessionService.touchSessionIfStale', () => {
  const prisma = {
    userSession: {
      update: jest.fn(),
    },
  };
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SESSION_TOUCH_MIN_INTERVAL_MS;
    service = new SessionService(prisma as unknown as PrismaService);
  });

  const session = (lastActiveAt: Date): UserSession =>
    ({
      id: 'sess-1',
      userId: 'user-1',
      lastActiveAt,
    }) as UserSession;

  it('skips update when lastActiveAt is within default 60s interval', async () => {
    await service.touchSessionIfStale(session(new Date(Date.now() - 30_000)));
    expect(prisma.userSession.update).not.toHaveBeenCalled();
  });

  it('updates when lastActiveAt is older than interval', async () => {
    await service.touchSessionIfStale(session(new Date(Date.now() - 120_000)));
    expect(prisma.userSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-1' },
      }),
    );
  });
});
