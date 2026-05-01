export type VerificationEmailInput = {
  to: string;
  verifyUrl: string;
  userId: string;
};

export abstract class EmailService {
  abstract sendVerificationEmail(input: VerificationEmailInput): Promise<void>;
}
