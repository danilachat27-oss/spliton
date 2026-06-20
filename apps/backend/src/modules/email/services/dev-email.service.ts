import { Injectable, Logger } from '@nestjs/common';
import {
  EmailService,
  NotificationEmailInput,
  PasswordResetEmailInput,
  VerificationEmailInput,
} from '../email.service';
import { DevEmailOutboxService } from './dev-email-outbox.service';

@Injectable()
export class DevEmailService extends EmailService {
  private readonly logger = new Logger(DevEmailService.name);
  constructor(private readonly outbox: DevEmailOutboxService) {
    super();
  }

  sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    this.outbox.push({
      to: input.to,
      userId: input.userId,
      verifyUrl: input.verifyUrl,
    });
    this.logger.log(
      `verification email queued for ${this.maskEmail(input.to)} (userId=${input.userId})`,
    );
    return Promise.resolve();
  }

  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    this.outbox.push({
      to: input.to,
      userId: input.userId,
      verifyUrl: input.resetUrl,
    });
    this.logger.log(
      `password reset email queued for ${this.maskEmail(input.to)} (userId=${input.userId})`,
    );
    return Promise.resolve();
  }

  sendNotificationEmail(input: NotificationEmailInput): Promise<void> {
    this.outbox.push({
      to: input.to,
      userId: input.userId,
      verifyUrl: `[notification] ${input.subject}`,
    });
    this.logger.log(
      `notification email queued for ${this.maskEmail(input.to)}: ${input.subject}`,
    );
    return Promise.resolve();
  }

  private maskEmail(email: string): string {
    const [local = '', domain = '***'] = email.split('@');
    if (!local) {
      return `***@${domain}`;
    }
    return `${local.charAt(0)}***@${domain}`;
  }
}
