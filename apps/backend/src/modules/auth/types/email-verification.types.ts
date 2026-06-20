export type RegisterEmailVerificationResponse = {
  requiresEmailVerification: true;
};

export type EmailVerifyResponse = {
  verified: true;
  userId?: string;
};

export type EmailResendResponse = {
  success: true;
};
