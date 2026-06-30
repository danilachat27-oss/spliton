import { Test, TestingModule } from '@nestjs/testing';
import { DepositNetworkSettingsStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { DepositNetworkSettingsService } from './deposit-network-settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DepositNetworkSettingsService', () => {
  let service: DepositNetworkSettingsService;
  const prisma = {
    depositNetworkSettings: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositNetworkSettingsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'tron') {
                return {
                  mode: 'mock',
                  usdtContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                  confirmations: 20,
                };
              }
              if (key === 'wallet') {
                return { defaultAssetCode: 'USDT', defaultNetwork: 'TRC20' };
              }
              if (key === 'app.nodeEnv') return 'test';
              return null;
            },
          },
        },
      ],
    }).compile();
    service = module.get(DepositNetworkSettingsService);
  });

  const sampleSettings = {
    id: 'usdt-trc20',
    asset: 'USDT',
    network: 'TRC20',
    networkDisplayName: 'USDT · TRC20',
    chain: 'TRON',
    tokenContractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    tokenDecimals: 6,
    minDepositAmount: '0.01',
    maxDepositAmount: null,
    minConfirmations: 20,
    estimatedCreditTimeMinutes: 1,
    withdrawAvailableAfterMinutes: 2,
    depositEnabled: true,
    withdrawalEnabled: true,
    status: DepositNetworkSettingsStatus.ACTIVE,
    poolLowThreshold: 5,
    providerMode: 'mock',
    providerName: 'Mock',
    explorerTxUrlTemplate: null,
    explorerAddressUrlTemplate: null,
    explorerTokenUrlTemplate: null,
    userWarningRu: 'Line1\nLine2',
    userWarningEn: 'EN warn',
    userWarningEs: null,
    userWarningPt: null,
    userWarningKa: null,
    maintenanceMessageRu: null,
    maintenanceMessageEn: 'EN maint',
    maintenanceMessageEs: null,
    maintenanceMessagePt: null,
    maintenanceMessageKa: null,
    instructionsRu: 'RU inst',
    instructionsEn: 'EN inst',
    instructionsEs: null,
    instructionsPt: null,
    publishedAt: null,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  };

  it('marks draft settings as disabled provider status', () => {
    const status = service.resolveProviderStatus({
      ...sampleSettings,
      status: DepositNetworkSettingsStatus.DRAFT,
    });
    expect(status).toBe('disabled');
  });

  it('splits user warnings by newline', () => {
    const lines = service.pickUserWarning(sampleSettings, 'ru');
    expect(lines).toEqual(['Line1', 'Line2']);
  });

  it('uses EN deposit copy for es/pt with fallback', () => {
    expect(service.pickMaintenanceMessage(sampleSettings, 'es')).toBe('EN maint');
    expect(service.pickMaintenanceMessage(sampleSettings, 'pt')).toBe('EN maint');
    expect(service.pickUserWarning(sampleSettings, 'es')).toEqual(['EN warn']);
    expect(service.pickInstructions(sampleSettings, 'en')).toBe('EN inst');
  });

  it('rejects enable without contract address', async () => {
    prisma.depositNetworkSettings.findFirst.mockResolvedValue({
      id: 'usdt-trc20',
      asset: 'USDT',
      network: 'TRC20',
      networkDisplayName: null,
      chain: 'TRON',
      tokenContractAddress: null,
      tokenDecimals: 6,
      minDepositAmount: { toString: () => '0.01' },
      maxDepositAmount: null,
      minConfirmations: 20,
      estimatedCreditTimeMinutes: 1,
      withdrawAvailableAfterMinutes: 2,
      depositEnabled: false,
      withdrawalEnabled: true,
      status: DepositNetworkSettingsStatus.ACTIVE,
      poolLowThreshold: 5,
      providerMode: 'mock',
      providerName: null,
      explorerTxUrlTemplate: null,
      explorerAddressUrlTemplate: null,
      explorerTokenUrlTemplate: null,
      userWarningRu: null,
      userWarningEn: null,
      userWarningEs: null,
      userWarningPt: null,
      userWarningKa: null,
      maintenanceMessageRu: null,
      maintenanceMessageEn: null,
      maintenanceMessageEs: null,
      maintenanceMessagePt: null,
      maintenanceMessageKa: null,
      instructionsRu: null,
      instructionsEn: null,
      instructionsEs: null,
      instructionsPt: null,
      publishedAt: null,
      archivedAt: null,
      updatedAt: new Date(),
    });
    await expect(
      service.updateSettings('u1', { depositEnabled: true, reason: 'test' }),
    ).rejects.toMatchObject({
      response: { error: { code: 'DEPOSIT_SETTINGS_INCOMPLETE' } },
    });
  });
});
