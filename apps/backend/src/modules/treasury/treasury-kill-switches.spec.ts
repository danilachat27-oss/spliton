import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';

describe('Treasury kill switches', () => {
  const config = { get: jest.fn() };
  const service = new FeatureFlagsService(config as never);

  afterEach(() => {
    delete process.env.KILL_SWITCH_DISABLE_WITHDRAWALS;
    delete process.env.KILL_SWITCH_DISABLE_DEPOSITS;
    delete process.env.KILL_SWITCH_DISABLE_REVENUE_DISTRIBUTION;
  });

  it('blocks withdrawals when kill switch is on', () => {
    process.env.KILL_SWITCH_DISABLE_WITHDRAWALS = 'true';
    expect(service.isEffectivelyEnabled('enableWithdrawals')).toBe(false);
  });

  it('blocks deposits when disable deposits kill switch is on', () => {
    process.env.KILL_SWITCH_DISABLE_DEPOSITS = 'true';
    expect(service.isEffectivelyEnabled('enableDeposits')).toBe(false);
  });

  it('blocks revenue distribution when kill switch is on', () => {
    process.env.KILL_SWITCH_DISABLE_REVENUE_DISTRIBUTION = 'true';
    expect(service.isEffectivelyEnabled('enableRevenueDistributionRun')).toBe(false);
  });
});
