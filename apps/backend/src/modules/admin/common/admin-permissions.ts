import { HttpStatus } from '@nestjs/common';

import {
  assertMatrixArea,
  assertBusinessAnalystReadOnly,
  type AdminMatrixAction,
} from './admin-role-matrix';
import { throwAdminError } from './admin-http.util';

export type AdminArea =
  | 'users'
  | 'deposits'
  | 'withdrawals'
  | 'wallets'
  | 'holdings'
  | 'audit'
  | 'revenue'
  | 'secondary_market'
  | 'reports'
  | 'settings';

export type AdminAction = 'view' | 'mutate' | 'approve' | 'finance';

function toMatrixAction(action: AdminAction): AdminMatrixAction {
  if (action === 'finance') return 'mutate';
  return action;
}

export function assertAdminArea(
  roles: string[],
  area: AdminArea,
  action: AdminAction = 'view',
): void {
  assertBusinessAnalystReadOnly(roles, toMatrixAction(action));
  try {
    assertMatrixArea(roles, area, toMatrixAction(action));
  } catch {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions for this action',
      HttpStatus.FORBIDDEN,
    );
  }
}
