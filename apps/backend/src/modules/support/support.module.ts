import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserSupportController } from './user-support.controller';
import { UserSupportService } from './user-support.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UserSupportController],
  providers: [UserSupportService],
  exports: [UserSupportService],
})
export class SupportModule {}
