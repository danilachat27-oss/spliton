import { deleteE2eUsersWhere } from './delete-e2e-users-cascade';

const EMAIL_PREFIX = 'test-auth-regression-';
const EMAIL_SUFFIX = '@example.com';

/**
 * Deletes users created by auth regression e2e (email prefix + example.com domain only).
 */
export async function cleanupAuthRegressionUsers(): Promise<void> {
  await deleteE2eUsersWhere({
    email: {
      startsWith: EMAIL_PREFIX,
      endsWith: EMAIL_SUFFIX,
    },
  });
}
