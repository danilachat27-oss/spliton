import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  ADMIN_ROLE_MATRIX,
  capabilitiesForRoles,
  navSectionsForRoles,
  type AdminMatrixSection,
} from './common/admin-role-matrix';

@Injectable()
export class AdminAccessService {
  permissions(user: AuthUser) {
    const sections = navSectionsForRoles(user.roles);
    const capabilities = capabilitiesForRoles(user.roles);
    return {
      ok: true as const,
      version: 'v1' as const,
      roles: user.roles,
      sections,
      capabilities,
      matrix: this.publicMatrixSnapshot(sections),
    };
  }

  /** Subset of matrix for sections the user can access (for UI role matrix page). */
  private publicMatrixSnapshot(visibleSections: AdminMatrixSection[]) {
    const out: Record<string, Record<string, string>> = {};
    for (const section of visibleSections) {
      out[section] = { ...ADMIN_ROLE_MATRIX[section] };
    }
    return out;
  }
}
