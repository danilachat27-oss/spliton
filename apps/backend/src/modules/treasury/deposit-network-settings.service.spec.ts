import { Test, TestingModule } from '@nestjs/testing';
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

  it('marks mock provider as degraded in production', () => {
    const status = service.resolveProviderStatus({
      id: 'usdt-trc20',
      asset: 'USDT',
      network: 'TRC20',
      chain: 'TRON',
      tokenContractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      tokenDecimals: 6,
      minDepositAmount: '0.01',
      minConfirmations: 20,
      estimatedCreditTimeMinutes: 1,
      withdrawAvailableAfterMinutes: 2,
      depositEnabled: true,
      withdrawalEnabled: true,
      providerMode: 'mock',
      providerName: 'Mock',
      explorerTxUrlTemplate: null,
      explorerAddressUrlTemplate: null,
      explorerTokenUrlTemplate: null,
      userWarningRu: null,
      userWarningEn: null,
      userWarningKa: null,
      maintenanceMessageRu: null,
      maintenanceMessageEn: null,
      maintenanceMessageKa: null,
      updatedAt: new Date().toISOString(),
    });
    expect(status).toBe('degraded');
  });

  it('splits user warnings by newline', () => {
    const lines = service.pickUserWarning(
      {
        id: 'x',
        asset: 'USDT',
        network: 'TRC20',
        chain: 'TRON',
        tokenContractAddress: null,
        tokenDecimals: 6,
        minDepositAmount: '0.01',
        minConfirmations: 1,
        estimatedCreditTimeMinutes: 1,
        withdrawAvailableAfterMinutes: 2,
        depositEnabled: true,
        withdrawalEnabled: true,
        providerMode: 'mock',
        providerName: null,
        explorerTxUrlTemplate: null,
        explorerAddressUrlTemplate: null,
        explorerTokenUrlTemplate: null,
        userWarningRu: 'Line1\nLine2',
        userWarningEn: null,
        userWarningKa: null,
        maintenanceMessageRu: null,
        maintenanceMessageEn: null,
        maintenanceMessageKa: null,
        updatedAt: new Date().toISOString(),
      },
      'ru',
    );
    expect(lines).toEqual(['Line1', 'Line2']);
  });

  it('uses EN deposit copy for es/pt with RU fallback', () => {
    const settings = {
      id: 'x',
      asset: 'USDT',
      network: 'TRC20',
      chain: 'TRON',
      tokenContractAddress: null,
      tokenDecimals: 6,
      minDepositAmount: '0.01',
      minConfirmations: 1,
      estimatedCreditTimeMinutes: 1,
      withdrawAvailableAfterMinutes: 2,
      depositEnabled: true,
      withdrawalEnabled: true,
      providerMode: 'mock',
      providerName: null,
      explorerTxUrlTemplate: null,
      explorerAddressUrlTemplate: null,
      explorerTokenUrlTemplate: null,
      userWarningRu: 'RU warn',
      userWarningEn: 'EN warn',
      userWarningKa: null,
      maintenanceMessageRu: 'RU maint',
      maintenanceMessageEn: 'EN maint',
      maintenanceMessageKa: null,
      updatedAt: new Date().toISOString(),
    };

    expect(service.pickMaintenanceMessage(settings, 'es')).toBe('EN maint');
    expect(service.pickMaintenanceMessage(settings, 'pt')).toBe('EN maint');
    expect(service.pickUserWarning(settings, 'es')).toEqual(['EN warn']);
    expect(service.pickMaintenanceMessage(settings, 'ka')).toBe('RU maint');
  });
});
