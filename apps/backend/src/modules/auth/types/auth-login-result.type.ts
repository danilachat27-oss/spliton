import type { AuthResponse } from './auth-response.type';

export type Requires2faResponse = {
  requires2fa: true;
  challengeId: string;
  availableMethods: ['totp', 'backup_code'];
};

export type EmailNotVerifiedResponse = {
  code: 'EMAIL_NOT_VERIFIED';
  message: 'Email verification required';
};

export type AuthLoginResult =
  | AuthResponse
  | Requires2faResponse
  | EmailNotVerifiedResponse;
