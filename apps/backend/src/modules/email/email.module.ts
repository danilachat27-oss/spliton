import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevEmailOutboxController } from './dev-email-outbox.controller';
import { EmailService } from './email.service';
import { DevEmailService } from './services/dev-email.service';
import { DevEmailOutboxService } from './services/dev-email-outbox.service';
import { PostmarkEmailService } from './services/postmark-email.service';
import { ResendEmailService } from './services/resend-email.service';

@Module({
  imports: [ConfigModule],
  controllers: [DevEmailOutboxController],
  providers: [
    DevEmailOutboxService,
    DevEmailService,
    {
      provide: EmailService,
      inject: [ConfigService, DevEmailService],
      useFactory: (
        configService: ConfigService,
        devService: DevEmailService,
      ) => {
        const provider = configService.get<string>('EMAIL_PROVIDER') ?? 'dev';
        if (provider === 'postmark') {
          return new PostmarkEmailService(configService);
        }
        if (provider === 'resend') {
          return new ResendEmailService(configService);
        }
        return devService;
      },
    },
  ],
  exports: [EmailService, DevEmailOutboxService],
})
export class EmailModule {}
