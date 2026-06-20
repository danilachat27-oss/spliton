import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';
import {
  EmailService,
  NotificationEmailInput,
  PasswordResetEmailInput,
  VerificationEmailInput,
} from '../email.service';
import { buildSplitonEmailHtml } from '../spliton-email-layout';

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
      'Подтвердите email для входа в Spliton:\n\n' +
      `${input.verifyUrl}\n\n` +
      'Если вы не регистрировались — проигнорируйте письмо.';

    const htmlBody = buildSplitonEmailHtml({
      title: 'Подтверждение email',
      bodyHtml:
        '<p>Нажмите кнопку, чтобы подтвердить адрес и завершить регистрацию.</p>' +
        `<p style="font-size:13px;color:#71717a;word-break:break-all;">Или скопируйте ссылку: ${input.verifyUrl}</p>`,
      ctaLabel: 'Подтвердить email',
      ctaUrl: input.verifyUrl,
    });

    try {
      await this.client.sendEmail({
        From: this.emailFrom,
        To: input.to,
        Subject: 'Подтвердите email — Spliton',
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

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    const textBody =
      'Сброс пароля Spliton:\n\n' +
      `${input.resetUrl}\n\n` +
      'Если вы не запрашивали сброс — проигнорируйте письмо.';

    const htmlBody = buildSplitonEmailHtml({
      title: 'Сброс пароля',
      bodyHtml:
        '<p>Ссылка действует ограниченное время. После смены пароля все активные сессии могут быть завершены.</p>' +
        `<p style="font-size:13px;color:#71717a;word-break:break-all;">Или скопируйте ссылку: ${input.resetUrl}</p>`,
      ctaLabel: 'Сбросить пароль',
      ctaUrl: input.resetUrl,
    });

    try {
      await this.client.sendEmail({
        From: this.emailFrom,
        To: input.to,
        Subject: 'Сброс пароля — Spliton',
        HtmlBody: htmlBody,
        TextBody: textBody,
        ...(this.messageStream ? { MessageStream: this.messageStream } : {}),
      });
      this.logger.log(
        `password reset email sent via provider=postmark to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
    } catch {
      this.logger.warn(
        `password reset email send failed provider=postmark to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
      throw new ServiceUnavailableException(
        'Unable to send password reset email',
      );
    }
  }

  async sendNotificationEmail(input: NotificationEmailInput): Promise<void> {
    const textBody = `${input.textBody}\n\n— Spliton`;
    const htmlBody = buildSplitonEmailHtml({
      title: input.subject,
      bodyHtml: `<p>${input.textBody.replace(/\n/g, '<br/>')}</p>`,
    });
    try {
      await this.client.sendEmail({
        From: this.emailFrom,
        To: input.to,
        Subject: input.subject,
        TextBody: textBody,
        HtmlBody: htmlBody,
        ...(this.messageStream ? { MessageStream: this.messageStream } : {}),
      });
      this.logger.log(
        `notification email sent via provider=postmark to ${this.maskEmail(input.to)}`,
      );
    } catch {
      this.logger.warn(
        `notification email send failed provider=postmark to ${this.maskEmail(input.to)}`,
      );
      throw new ServiceUnavailableException('Unable to send notification email');
    }
  }

  private maskEmail(email: string): string {
    const [local = '', domain = '***'] = email.split('@');
    if (!local) return `***@${domain}`;
    return `${local.charAt(0)}***@${domain}`;
  }
}
