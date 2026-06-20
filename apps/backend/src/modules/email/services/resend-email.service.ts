import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailService,
  NotificationEmailInput,
  PasswordResetEmailInput,
  VerificationEmailInput,
} from '../email.service';
import { buildSplitonEmailHtml } from '../spliton-email-layout';

type ResendSendResponse = {
  id?: string;
  error?: { message?: string };
};

@Injectable()
export class ResendEmailService extends EmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly apiKey: string;
  private readonly emailFrom: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const from = this.configService.get<string>('EMAIL_FROM')?.trim();
    if (!apiKey || !from) {
      throw new ServiceUnavailableException(
        'Resend email provider is not configured',
      );
    }
    this.apiKey = apiKey;
    this.emailFrom = from;
  }

  private async sendViaResend(payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.emailFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as ResendSendResponse;
    if (!res.ok) {
      throw new ServiceUnavailableException(
        body.error?.message ?? 'Resend API request failed',
      );
    }
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
      await this.sendViaResend({
        to: input.to,
        subject: 'Подтвердите email — Spliton',
        html: htmlBody,
        text: textBody,
      });
      this.logger.log(
        `verification email sent via provider=resend to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
    } catch {
      this.logger.warn(
        `verification email send failed provider=resend to ${this.maskEmail(input.to)} (userId=${input.userId})`,
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
      'Ссылка действует ограниченное время. Если вы не запрашивали сброс — проигнорируйте письмо.';
    const htmlBody = buildSplitonEmailHtml({
      title: 'Сброс пароля',
      bodyHtml:
        '<p>Запрошен сброс пароля. Нажмите кнопку, чтобы задать новый пароль.</p>' +
        `<p style="font-size:13px;color:#71717a;word-break:break-all;">Или скопируйте ссылку: ${input.resetUrl}</p>`,
      ctaLabel: 'Сбросить пароль',
      ctaUrl: input.resetUrl,
    });
    try {
      await this.sendViaResend({
        to: input.to,
        subject: 'Сброс пароля — Spliton',
        html: htmlBody,
        text: textBody,
      });
      this.logger.log(
        `password reset email sent via provider=resend to ${this.maskEmail(input.to)} (userId=${input.userId})`,
      );
    } catch {
      this.logger.warn(
        `password reset email send failed provider=resend to ${this.maskEmail(input.to)} (userId=${input.userId})`,
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
      await this.sendViaResend({
        to: input.to,
        subject: input.subject,
        html: htmlBody,
        text: textBody,
      });
      this.logger.log(
        `notification email sent via provider=resend to ${this.maskEmail(input.to)}`,
      );
    } catch {
      this.logger.warn(
        `notification email send failed provider=resend to ${this.maskEmail(input.to)}`,
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
