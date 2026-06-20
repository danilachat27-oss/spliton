import { HttpStatus } from '@nestjs/common';

import {
  assertMatrixSection,
  canMatrixAction,
} from '../common/admin-role-matrix';
import { throwAdminError } from '../common/admin-http.util';

const HELP_CONTENT_MANAGERS = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_MANAGER',
]);

const HELP_ARTICLE_EDITORS = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_MANAGER',
  'SUPPORT_MANAGER',
]);

export function assertHelpCenterView(roles: string[]): void {
  assertMatrixSection(roles, 'helpCenter', 'view');
}

export function assertHelpCenterCategoryMutate(roles: string[]): void {
  assertHelpCenterView(roles);
  if (!roles.some((role) => HELP_CONTENT_MANAGERS.has(role))) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions to manage help categories',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertHelpCenterArticleMutate(roles: string[]): void {
  assertHelpCenterView(roles);
  if (!canMatrixAction(roles, 'helpCenter', 'mutate')) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions to manage help articles',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertHelpCenterArticlePublish(roles: string[]): void {
  assertHelpCenterView(roles);
  if (!roles.some((role) => HELP_ARTICLE_EDITORS.has(role))) {
    throwAdminError(
      'ADMIN_FORBIDDEN',
      'Insufficient permissions to publish or archive help articles',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertHelpCenterArticleDelete(roles: string[]): void {
  assertHelpCenterCategoryMutate(roles);
}

export function assertHelpCenterArticleReorder(roles: string[]): void {
  assertHelpCenterArticleMutate(roles);
}

export function assertHelpCenterCategoryReorder(roles: string[]): void {
  assertHelpCenterCategoryMutate(roles);
}
