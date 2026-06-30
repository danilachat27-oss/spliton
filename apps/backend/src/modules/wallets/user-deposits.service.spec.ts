import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserDepositsService } from './user-deposits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserWalletService } from './user-wallet.service';
import { DepositAddressProvider } from './deposit-address.provider';
import { DepositNetworkSettingsService } from '../treasury/deposit-network-settings.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,abc'),
}));

describe('UserDepositsService', () => {
  let service: UserDepositsService;
  const wallets = { getOrCreateWallet: jest.fn() };
  const depositAddress = { resolveForUser: jest.fn() };
  const networkSettings = {
    getForAssetNetwork: jest.fn(),
    resolveProviderStatus: jest.fn(),
    pickMaintenanceMessage: jest.fn(),
    pickUserWarning: jest.fn(),
    pickInstructions: jest.fn(),
    buildExplorerUrl: jest.fn(),
    assertProductionReady: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDepositsService,
        { provide: PrismaService, useValue: { deposit: { count: jest.fn(), findMany: jest.fn() } } },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              k === 'wallet'
                ? { defaultAssetCode: 'USDT', defaultNetwork: 'TRC20' }
                : k === 'app.nodeEnv'
                  ? 'development'
                  : null,
          },
        },
        { provide: UserWalletService, useValue: wallets },
        { provide: DepositAddressProvider, useValue: depositAddress },
        { provide: DepositNetworkSettingsService, useValue: networkSettings },
      ],
    }).compile();
    service = module.get(UserDepositsService);
  });

  const baseSettings = {
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
    status: 'ACTIVE',
    providerMode: 'mock',
    providerName: null,
    explorerTxUrlTemplate: null,
    explorerAddressUrlTemplate: 'https://tronscan.org/#/address/{address}',
    explorerTokenUrlTemplate: null,
    userWarningRu: 'Warn',
    userWarningEn: null,
    userWarningKa: null,
    maintenanceMessageRu: null,
    maintenanceMessageEn: null,
    maintenanceMessageKa: null,
    updatedAt: new Date().toISOString(),
  };

  it('returns deposit info with QR payload equal to address', async () => {
    wallets.getOrCreateWallet.mockResolvedValue({
      id: 'w1',
      address: null,
    });
    networkSettings.getForAssetNetwork.mockResolvedValue(baseSettings);
    networkSettings.resolveProviderStatus.mockReturnValue('degraded');
    networkSettings.pickMaintenanceMessage.mockReturnValue(null);
    networkSettings.pickUserWarning.mockReturnValue(['Warn']);
    networkSettings.pickInstructions.mockReturnValue('Send USDT TRC20 only');
    networkSettings.buildExplorerUrl.mockReturnValue('https://tronscan.org/#/address/TAddr');
    depositAddress.resolveForUser.mockResolvedValue({
      kind: 'address',
      address: 'TAddr123456789012345678901234567890',
    });

    const info = await service.getDepositInfo('u1');
    expect(info.address).toBe('TAddr123456789012345678901234567890');
    expect(info.qrPayload).toBe(info.address);
    expect(info.minDepositAmount).toBe('0.01');
    expect(info.qrDataUrl).toContain('data:image');
  });

  it('throws DEPOSIT_DISABLED when deposits off', async () => {
    networkSettings.getForAssetNetwork.mockResolvedValue({
      ...baseSettings,
      depositEnabled: false,
    });
    networkSettings.pickMaintenanceMessage.mockReturnValue('Техработы');

    await expect(service.getDepositInfo('u1')).rejects.toMatchObject({
      response: {
        error: { code: 'DEPOSIT_DISABLED' },
      },
    });
  });
});
