import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { requestMeta } from '../admin/common/admin-http.util';
import { CreatePrimaryOrderDto } from './dto/create-primary-order.dto';
import { PrimaryOrderPreviewDto } from './dto/primary-order-preview.dto';
import { PrimaryOrderService } from './primary-order.service';
import { UserMarketService } from './user-market.service';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
export class UserOrdersController {
  constructor(
    private readonly market: UserMarketService,
    private readonly primaryOrders: PrimaryOrderService,
  ) {}

  @Get('primary-round/:releaseId')
  primaryRound(@Param('releaseId') releaseId: string) {
    return this.market.getActivePrimaryRound(releaseId);
  }

  @Post('primary-preview')
  @HttpCode(HttpStatus.OK)
  preview(
    @CurrentUser() user: AuthUser,
    @Body() dto: PrimaryOrderPreviewDto,
  ) {
    return this.primaryOrders.preview(user.id, dto.roundId, dto.units);
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePrimaryOrderDto,
    @Headers('idempotency-key') idempotencyHeader: string | undefined,
    @Req() req: Request,
  ) {
    const key = (dto.idempotencyKey ?? idempotencyHeader)?.trim();
    if (!key) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message:
          'Idempotency-Key header or idempotencyKey body field is required',
      });
    }
    dto.idempotencyKey = key;
    return this.primaryOrders.purchase(user.id, dto, requestMeta(req));
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.primaryOrders.listForUser(user.id, query.page, query.pageSize);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.primaryOrders.getForUser(user.id, id);
  }
}
