import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  const prisma = {
    user: { findUnique: jest.fn() },
    userOnboardingState: { upsert: jest.fn(), update: jest.fn() },
    walletTransaction: { count: jest.fn() },
    userPosition: { count: jest.fn() },
    order: { count: jest.fn() },
    twoFactorMethod: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnboardingService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(OnboardingService);
  });

  it('marks email step completed when verified', async () => {
    prisma.userOnboardingState.upsert.mockResolvedValue({
      userId: 'u1',
      dismissedAt: null,
      completedAt: null,
      stepOverrides: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      emailVerifiedAt: new Date(),
      profile: { displayName: 'Test' },
    });
    prisma.walletTransaction.count.mockResolvedValue(0);
    prisma.userPosition.count.mockResolvedValue(0);
    prisma.order.count.mockResolvedValue(0);
    prisma.twoFactorMethod.count.mockResolvedValue(0);

    const result = await service.getForUser('u1');
    const email = result.steps.find((s) => s.id === 'verify_email');
    expect(email?.status).toBe('completed');
  });
});
