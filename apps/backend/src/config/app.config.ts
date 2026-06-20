import { resolveThrottleConfig } from './throttle.config';

export default () => ({
  app: {
    serviceName: 'spliton-backend',
    port: Number(process.env.PORT ?? 4001),
    frontendOrigin:
      process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN?.trim() || null,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  wallet: {
    defaultAssetCode: 'USDT',
    defaultNetwork: 'TRC20',
    minWithdrawalUsdt: Number(process.env.MIN_WITHDRAWAL_USDT ?? 50),
    defaultWithdrawalFeeUsdt: Number(process.env.WITHDRAWAL_FEE_USDT ?? 5),
  },
  throttle: resolveThrottleConfig(),
  tron: {
    mode: process.env.TRON_PROVIDER_MODE ?? 'mock',
    providerUrl: process.env.TRON_PROVIDER_URL ?? '',
    apiKey: process.env.TRON_API_KEY ?? '',
    confirmations: Number(process.env.TRON_CONFIRMATIONS ?? 20),
    pollIntervalMs: Number(process.env.TRON_POLL_INTERVAL ?? 15000),
    usdtContract: process.env.TRON_USDT_CONTRACT ?? '',
  },
});
