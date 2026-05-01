import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { DevEmailService } from './services/dev-email.service';

@Module({
  providers: [
    DevEmailService,
    {
      provide: EmailService,
      useExisting: DevEmailService,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
