import { deleteE2eUsersWhere } from './delete-e2e-users-cascade';

const EMAIL_PREFIX = 'test-2fa-regression-';
const EMAIL_SUFFIX = '@example.com';

export async function cleanupTwoFactorRegressionUsers(): Promise<void> {
  await deleteE2eUsersWhere({
    email: {
      startsWith: EMAIL_PREFIX,
      endsWith: EMAIL_SUFFIX,
    },
  });
}
