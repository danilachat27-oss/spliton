import { HttpException } from '@nestjs/common';
import { ErrorCodes } from '../errors/error-codes';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService error codes', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    service = new FeatureFlagsService({ get: () => undefined } as never);
  });

  afterEach(() => {
    delete process.env.KILL_SWITCH_DISABLE_WITHDRAWALS;
    delete process.env.FEATURE_ENABLE_WITHDRAWALS;
  });

  it('throws WITHDRAWAL_DISABLED when kill switch active', () => {
    process.env.KILL_SWITCH_DISABLE_WITHDRAWALS = 'true';
    try {
      service.assertEnabled('enableWithdrawals');
      expect(true).toBe(false);
    } catch (error) {
      const response = (error as HttpException).getResponse() as {
        error: { code: string };
      };
      expect(response.error.code).toBe(ErrorCodes.WITHDRAWAL_DISABLED);
    }
  });
});
