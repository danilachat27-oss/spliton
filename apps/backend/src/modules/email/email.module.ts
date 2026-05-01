import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { DevEmailService } from './services/dev-email.service';
import { PostmarkEmailService } from './services/postmark-email.service';

@Module({
  imports: [ConfigModule],
  providers: [
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
        return devService;
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
