import {
  Body,
  Controller,
  Get,
  NotFoundException,
  GoneException,
  ConflictException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { DocumentsService } from './documents.service';

function mapDocumentError(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === 'DOCUMENT_NOT_FOUND' || msg === 'TRADE_NOT_FOUND' || msg === 'ORDER_NOT_FOUND') {
    throw new NotFoundException(msg);
  }
  if (msg === 'DOCUMENT_EXPIRED') throw new GoneException(msg);
  if (msg === 'DOCUMENT_NOT_READY' || msg === 'TRADE_RECEIPT_NOT_FOUND' || msg === 'ORDER_RECEIPT_NOT_FOUND') {
    throw new ConflictException(msg);
  }
  throw error;
}

@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.documents.list(user.id, query.page, query.pageSize);
  }

  @Get(':id/download')
  async download(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    try {
      return await this.documents.download(user.id, id);
    } catch (error) {
      mapDocumentError(error);
    }
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documents.getById(user.id, id);
  }

  @Post('statement')
  statement(
    @CurrentUser() user: AuthUser,
    @Body() body: { dateFrom?: string; dateTo?: string; format?: string },
  ) {
    return this.documents.generateWalletStatement(user.id, body);
  }
}

@Controller('api/v1/wallet/deposits')
@UseGuards(JwtAuthGuard)
export class WalletDepositReceiptController {
  constructor(private readonly documents: DocumentsService) {}

  @Post(':id/receipt')
  depositReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documents.generateDepositReceipt(user.id, id);
  }
}

@Controller('api/v1/market/trades')
@UseGuards(JwtAuthGuard)
export class MarketTradeReceiptController {
  constructor(private readonly documents: DocumentsService) {}

  @Post(':id/receipt')
  async generateReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    try {
      return await this.documents.generateTradeReceipt(user.id, id);
    } catch (error) {
      mapDocumentError(error);
    }
  }

  @Get(':id/receipt')
  async getReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    try {
      const doc = await this.documents.getTradeReceiptDocument(user.id, id);
      return await this.documents.download(user.id, doc.id);
    } catch (error) {
      mapDocumentError(error);
    }
  }
}

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
export class PrimaryOrderReceiptController {
  constructor(private readonly documents: DocumentsService) {}

  @Post(':id/receipt')
  async generateReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    try {
      return await this.documents.generatePrimaryOrderReceipt(user.id, id);
    } catch (error) {
      mapDocumentError(error);
    }
  }

  @Get(':id/receipt')
  async getOrderReceipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    try {
      const doc = await this.documents.getPrimaryOrderReceiptDocument(user.id, id);
      return await this.documents.download(user.id, doc.id);
    } catch (error) {
      mapDocumentError(error);
    }
  }
}
