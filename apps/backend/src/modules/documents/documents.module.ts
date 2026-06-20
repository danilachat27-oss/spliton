import { Module } from '@nestjs/common';
import { ExportModule } from '../../common/export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import {
  DocumentsController,
  MarketTradeReceiptController,
  PrimaryOrderReceiptController,
  WalletDepositReceiptController,
} from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, ExportModule, WalletsModule],
  controllers: [
    DocumentsController,
    WalletDepositReceiptController,
    MarketTradeReceiptController,
    PrimaryOrderReceiptController,
  ],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
