import { AdminUpdateType, UserRoleCode } from '@prisma/client';
import {
  assertAdminUpdatesMutate,
  audienceMatchesUser,
  canManageAdminUpdates,
} from './admin-updates-permissions';

describe('AdminUpdatesPermissions', () => {
  it('allows ADMIN to manage any update type', () => {
    expect(canManageAdminUpdates([UserRoleCode.ADMIN], AdminUpdateType.BILLING)).toBe(
      true,
    );
  });

  it('allows COMPLIANCE to manage LEGAL updates only', () => {
    expect(canManageAdminUpdates([UserRoleCode.COMPLIANCE], AdminUpdateType.LEGAL)).toBe(
      true,
    );
    expect(
      canManageAdminUpdates([UserRoleCode.COMPLIANCE], AdminUpdateType.FEATURE),
    ).toBe(false);
  });

  it('blocks BUSINESS_ANALYST from mutate', () => {
    expect(() =>
      assertAdminUpdatesMutate([UserRoleCode.BUSINESS_ANALYST], AdminUpdateType.FEATURE),
    ).toThrow();
  });

  it('matches audience roles against user roles', () => {
    expect(
      audienceMatchesUser([UserRoleCode.ADMIN], [UserRoleCode.ADMIN, UserRoleCode.USER]),
    ).toBe(true);
    expect(
      audienceMatchesUser([UserRoleCode.COMPLIANCE], [UserRoleCode.ADMIN]),
    ).toBe(false);
  });
});
