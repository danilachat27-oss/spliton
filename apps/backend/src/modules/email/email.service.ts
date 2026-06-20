export type VerificationEmailInput = {
  to: string;
  verifyUrl: string;
  userId: string;
};

export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  userId: string;
};

export type NotificationEmailInput = {
  to: string;
  userId: string;
  subject: string;
  textBody: string;
};

export abstract class EmailService {
  abstract sendVerificationEmail(input: VerificationEmailInput): Promise<void>;
  abstract sendPasswordResetEmail(
    input: PasswordResetEmailInput,
  ): Promise<void>;
  abstract sendNotificationEmail(
    input: NotificationEmailInput,
  ): Promise<void>;
}
