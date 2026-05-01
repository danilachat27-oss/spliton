export type RegisterEmailVerificationResponse = {
  requiresEmailVerification: true;
};

export type EmailVerifyResponse = {
  verified: true;
};

export type EmailResendResponse = {
  success: true;
};
