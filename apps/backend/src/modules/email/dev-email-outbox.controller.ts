import {
  Controller,
  Get,
  NotFoundException,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevEmailOutboxService } from './services/dev-email-outbox.service';

@Controller('dev/email-outbox')
export class DevEmailOutboxController {
  constructor(
    private readonly configService: ConfigService,
    private readonly outbox: DevEmailOutboxService,
  ) {}

  @Get('latest')
  getLatest(@Query('email') email?: string) {
    this.assertEnabled();
    const latest = this.outbox.latestByEmail(email);
    if (!latest) {
      throw new NotFoundException('No dev email outbox entry');
    }
    return latest;
  }

  private assertEnabled(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    const enabled =
      this.configService.get<boolean>('DEV_EMAIL_OUTBOX_ENABLED') ?? false;
    if (nodeEnv === 'production' || !enabled) {
      throw new NotFoundException();
    }
    const provider = this.configService.get<string>('EMAIL_PROVIDER') ?? 'dev';
    if (provider !== 'dev') {
      throw new ServiceUnavailableException(
        'Dev email outbox is only available with EMAIL_PROVIDER=dev',
      );
    }
  }
}
