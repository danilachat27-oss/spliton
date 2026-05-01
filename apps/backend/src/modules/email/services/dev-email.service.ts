import { Injectable, Logger } from '@nestjs/common';
import { EmailService, VerificationEmailInput } from '../email.service';

@Injectable()
export class DevEmailService extends EmailService {
  private readonly logger = new Logger(DevEmailService.name);

  sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    this.logger.log(
      `verification email queued for ${this.maskEmail(input.to)} (userId=${input.userId})`,
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
