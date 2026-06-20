import {
  EmailService,
  NotificationEmailInput,
  PasswordResetEmailInput,
  VerificationEmailInput,
} from '../../src/modules/email/email.service';

export class FakeEmailService extends EmailService {
  private readonly latestVerificationTokenByEmail = new Map<string, string>();
  private readonly latestResetTokenByEmail = new Map<string, string>();

  sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    const parsed = new URL(input.verifyUrl);
    const token = parsed.searchParams.get('token');
    if (!token) {
      throw new Error('Verification URL missing token');
    }
    this.latestVerificationTokenByEmail.set(
      input.to.trim().toLowerCase(),
      token,
    );
    return Promise.resolve();
  }

  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    const parsed = new URL(input.resetUrl);
    const token = parsed.searchParams.get('token');
    if (!token) {
      throw new Error('Reset URL missing token');
    }
    this.latestResetTokenByEmail.set(input.to.trim().toLowerCase(), token);
    return Promise.resolve();
  }

  sendNotificationEmail(_input: NotificationEmailInput): Promise<void> {
    return Promise.resolve();
  }

  getLatestToken(email: string): string | null {
    return (
      this.latestVerificationTokenByEmail.get(email.trim().toLowerCase()) ??
      null
    );
  }

  getLatestResetToken(email: string): string | null {
    return this.latestResetTokenByEmail.get(email.trim().toLowerCase()) ?? null;
  }
}
