import { Module } from '@nestjs/common';
import { ExportModule } from '../../common/export/export.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import { UserAccountingController } from './user-accounting.controller';
import { StatementDocumentProcessorService } from './statement-document-processor.service';
import { UserAccountingService } from './user-accounting.service';

@Module({
  imports: [PrismaModule, AuthModule, WalletsModule, ExportModule],
  controllers: [UserAccountingController],
  providers: [UserAccountingService, StatementDocumentProcessorService],
})
export class UserAccountingModule {}
