export type AuthProvider = "google" | "email";

export type EmailSignInPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type EmailSignUpPayload = {
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export type SafeUser = {
  id: string;
  email: string;
  status: "ACTIVE" | "PENDING_EMAIL_VERIFICATION" | "SUSPENDED" | "BANNED" | "DELETED";
  profile: {
    displayName: string | null;
  } | null;
  roles: string[];
  createdAt: string;
};

export type LoginSuccessResponse = {
  user: SafeUser;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
};

export type LoginTwoFactorChallengeResponse = {
  requires2fa: true;
  challengeId: string;
  availableMethods: Array<"totp" | "backup_code">;
};

export type RegisterResponse = {
  requiresEmailVerification: true;
};

export type VerifyEmailResponse = {
  verified: true;
};

export type ResendEmailResponse = {
  success: true;
};

export type LogoutResponse = {
  success: true;
};

export type TwoFactorVerifyPayload = {
  challengeId: string;
  code: string;
  method: "totp" | "backup_code";
};

export type PendingTwoFactorChallenge = {
  challengeId: string;
  availableMethods: Array<"totp" | "backup_code">;
  email: string;
};
