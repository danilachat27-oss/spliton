import {
  EmailService,
  VerificationEmailInput,
} from '../../src/modules/email/email.service';

export class FakeEmailService extends EmailService {
  private readonly latestTokenByEmail = new Map<string, string>();

  sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    const parsed = new URL(input.verifyUrl);
    const token = parsed.searchParams.get('token');
    if (!token) {
      throw new Error('Verification URL missing token');
    }
    this.latestTokenByEmail.set(input.to.trim().toLowerCase(), token);
    return Promise.resolve();
  }

  getLatestToken(email: string): string | null {
    return this.latestTokenByEmail.get(email.trim().toLowerCase()) ?? null;
  }
}
