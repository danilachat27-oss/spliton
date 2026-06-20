import { deleteE2eUsersWhere } from './delete-e2e-users-cascade';

const E2E_DOMAIN = '@example.com';

/**
 * Deletes test users created by backend e2e suites (example.com only).
 * Safe for shared dev DBs: does not truncate tables or touch real domains.
 */
export async function cleanupE2eUsers(): Promise<number> {
  return deleteE2eUsersWhere({
    email: { endsWith: E2E_DOMAIN },
  });
}
