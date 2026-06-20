import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PartnerStatus } from '@prisma/client';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReferralsService', () => {
  let service: ReferralsService;
  const prisma = {
    referralAttribution: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    referralProfile: {
      findUnique: jest.fn(),
    },
    partnerProfile: {
      findFirst: jest.fn(),
    },
    riskFlag: {
      create: jest.fn(),
    },
  };
  const notifications = { notifyUser: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: () => 'http://localhost:3000' },
        },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();
    service = module.get(ReferralsService);
  });

  it('blocks self-referral', async () => {
    prisma.referralProfile.findUnique.mockResolvedValue({
      userId: 'u1',
      code: 'ABC123',
    });

    await expect(
      service.attachOnRegistration('u1', 'ABC123'),
    ).rejects.toMatchObject({
      response: { error: { code: 'REFERRAL_SELF' } },
    });
    expect(prisma.riskFlag.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ flagCode: 'REFERRAL_SELF_ATTEMPT' }),
      }),
    );
  });

  it('blocks duplicate attribution', async () => {
    prisma.referralAttribution.findUnique.mockResolvedValue({ id: 'a1' });

    await expect(
      service.applyCodeForExistingUser('u2', 'CODE1'),
    ).rejects.toMatchObject({
      response: { error: { code: 'REFERRAL_ALREADY_ATTRIBUTED' } },
    });
  });

  it('resolves approved partner code', async () => {
    prisma.referralProfile.findUnique.mockResolvedValue(null);
    prisma.partnerProfile.findFirst.mockResolvedValue({
      id: 'p1',
      userId: 'partner-user',
      status: PartnerStatus.APPROVED,
    });

    const ref = await service.resolveReferrerByCode('P-ABC123');
    expect(ref).toEqual({ userId: 'partner-user', partnerProfileId: 'p1' });
  });

  it('creates attribution for valid referral code', async () => {
    prisma.referralProfile.findUnique.mockResolvedValue({
      userId: 'referrer',
      code: 'REFCODE',
    });
    prisma.referralAttribution.create.mockResolvedValue({ id: 'attr1' });

    const row = await service.attachOnRegistration('referred', 'refcode');
    expect(row).toEqual({ id: 'attr1' });
    expect(prisma.referralAttribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referrerUserId: 'referrer',
          referredUserId: 'referred',
        }),
      }),
    );
    expect(notifications.notifyUser).toHaveBeenCalled();
  });
});
