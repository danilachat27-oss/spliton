import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';
import { EmailService, VerificationEmailInput } from '../email.service';

@Injectable()
export class PostmarkEmailService extends EmailService {
  private readonly logger = new Logger(PostmarkEmailService.name);
  private readonly client: postmark.ServerClient;
  private readonly emailFrom: string;
  private readonly messageStream: string | null;

  constructor(private readonly configService: ConfigService) {
    super();
    const token = this.configService
      .get<string>('POSTMARK_SERVER_TOKEN')
      ?.trim();
    const from = this.configService.get<string>('EMAIL_FROM')?.trim();

    if (!token || !from) {
      throw new ServiceUnavailableException(
        'Postmark email provider is not configured',
      );
    }

    this.client = new postmark.ServerClient(token);
    this.emailFrom = from;
    this.messageStream =
      this.configService.get<string>('POSTMARK_MESSAGE_STREAM')?.trim() || null;
  }

  async sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    const textBody =
      'Verify your Spliton email by opening this link:\n\n' +
      `${input.verifyUrl}\n\n` +
      'If you did not create this account, you can ignore this email.';

    const htmlBody = `
      <p>Verify your Spliton email by using the button below.</p>
      <p>
        <a href="${input.verifyUrl}" style="display:inline-block;padding:10px 14px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
          Verify email
        </a>
      </p>
      <p>If the button does not work, copy this link:</p>
      <p>${input.verifyUrl}</p>
      <p>If you did not create this account, you can ignore this email.</p>
    `;

    try {
      await this.client.sendEmail({
        From: this.emailFrom,
        To: input.to,
        Subject: 'Verify your Spliton email',
        HtmlBody: htmlBody,
        TextBody: textBody,
        ...(this.messageStream ? { MessageStream: this.messageStream } : {}),
      });
      this.logger.log(
        `verification email sent via provider=postmark to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
    } catch {
      this.logger.warn(
        `verification email send failed provider=postmark to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
      throw new ServiceUnavailableException(
        'Unable to send verification email',
      );
    }
  }

  private maskEmail(email: string): string {
    const [local = '', domain = '***'] = email.split('@');
    if (!local) return `***@${domain}`;
    return `${local.charAt(0)}***@${domain}`;
  }
}
