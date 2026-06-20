import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { LegalModule } from '../legal/legal.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MeApiController } from './me-api.controller';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { AccountCenterService } from './account-center.service';
import { UserPasswordService } from './user-password.service';
import { UserSecurityPreferencesService } from './user-security-preferences.service';

@Module({
  imports: [PrismaModule, AuthModule, ComplianceModule, LegalModule, NotificationsModule],
  controllers: [UsersController, MeApiController],
  providers: [
    UsersService,
    UsersRepository,
    AccountCenterService,
    UserPasswordService,
    UserSecurityPreferencesService,
  ],
  exports: [UsersService, AccountCenterService],
})
export class UsersModule {}
