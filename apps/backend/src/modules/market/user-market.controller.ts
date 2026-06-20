import {
  Body,
  Controller,
  Delete,
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
import { BuyTradeDto } from './dto/buy-trade.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { FeePreviewQueryDto } from './dto/fee-preview-query.dto';
import { MarketDepthQueryDto } from './dto/market-depth-query.dto';
import { MarketListingsQueryDto } from './dto/market-listings-query.dto';
import { MarketOrderPreviewDto } from './dto/market-order-preview.dto';
import { MarketOrderSubmitDto } from './dto/market-order-submit.dto';
import { MarketPricesQueryDto } from './dto/market-prices-query.dto';
import { WatchlistMutationDto } from './dto/watchlist-mutation.dto';
import { SecondaryMarketMarketDataService } from './secondary-market-market-data.service';
import { SecondaryMarketResolveService } from './secondary-market-resolve.service';
import { UserMarketService } from './user-market.service';

@Controller('api/v1/market')
@UseGuards(JwtAuthGuard)
export class UserMarketController {
  constructor(
    private readonly market: UserMarketService,
    private readonly marketData: SecondaryMarketMarketDataService,
    private readonly marketResolve: SecondaryMarketResolveService,
  ) {}

  @Get('holdings')
  listHoldings(@CurrentUser() user: AuthUser) {
    return this.market.listHoldings(user.id);
  }

  @Get('listings')
  listListings(
    @CurrentUser() user: AuthUser,
    @Query() query: MarketListingsQueryDto,
  ) {
    return this.market.listListings(user.id, query);
  }

  @Get('listings/mine')
  listMyListings(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.market.listMyListings(user.id, query.page, query.pageSize);
  }

  @Get('fee-preview')
  feePreview(@CurrentUser() user: AuthUser, @Query() query: FeePreviewQueryDto) {
    return this.market.feePreview(user.id, query);
  }

  @Get('watchlist')
  listWatchlist(@CurrentUser() user: AuthUser) {
    return this.market.listWatchlist(user.id);
  }

  @Post('watchlist')
  @HttpCode(HttpStatus.CREATED)
  addWatchlist(
    @CurrentUser() user: AuthUser,
    @Body() dto: WatchlistMutationDto,
  ) {
    return this.market.addWatchlistItem(user.id, dto.releaseId);
  }

  @Delete('watchlist/:id')
  @HttpCode(HttpStatus.OK)
  removeWatchlist(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.market.removeWatchlistItem(user.id, id);
  }

  @Get('depth')
  getDepth(@CurrentUser() user: AuthUser, @Query() query: MarketDepthQueryDto) {
    return this.marketData.getDepth(query, user.id);
  }

  @Get('terminal/:marketId/user-state')
  getTerminalUserState(
    @CurrentUser() user: AuthUser,
    @Param('marketId') marketId: string,
  ) {
    return this.marketData.getUserTerminalState(marketId, user.id);
  }

  @Get('terminal/:marketId')
  getTerminal(
    @CurrentUser() user: AuthUser,
    @Param('marketId') marketId: string,
  ) {
    return this.marketData.getTerminalSummary(marketId, user.id);
  }

  @Get('recent-trades')
  getRecentTrades(
    @CurrentUser() user: AuthUser,
    @Query('marketId') marketId: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketData.getRecentTrades(
      marketId,
      limit ? Number(limit) : 20,
      user.id,
    );
  }

  @Get('my-orders')
  async listMyOrdersAlias(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
    @Query('marketId') marketId?: string,
    @Query('releaseId') releaseId?: string,
    @Query('status') _status?: string,
  ) {
    let rid = releaseId;
    if (!rid && marketId) {
      ({ releaseId: rid } =
        await this.marketResolve.resolveReleaseByMarketKey(marketId));
    }
    return this.market.listMyOrders(user.id, query.page, query.pageSize, rid);
  }

  @Post('orders/preview')
  @HttpCode(HttpStatus.OK)
  orderPreview(@CurrentUser() user: AuthUser, @Body() body: MarketOrderPreviewDto) {
    return this.market.orderPreview(user.id, body);
  }

  @Post('orders')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  submitOrder(
    @CurrentUser() user: AuthUser,
    @Body() body: MarketOrderSubmitDto,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyHeader?: string,
  ) {
    return this.market.submitMarketOrder(
      user.id,
      body,
      requestMeta(req),
      idempotencyHeader,
    );
  }

  @Post('orders/:id/cancel')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.market.cancelMarketOrder(user.id, id, requestMeta(req));
  }

  @Get('charts/sparkline')
  getSparkline(
    @CurrentUser() user: AuthUser,
    @Query('marketId') marketId: string,
    @Query('period') period?: string,
  ) {
    return this.marketData.getSparkline(marketId, period ?? '24h');
  }

  @Get('prices')
  getPrices(@Query() query: MarketPricesQueryDto) {
    return this.marketData.getPriceHistory(query);
  }

  @Get('listings/:id')
  getListing(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.marketData.getListingDetail(id, user.id);
  }

  @Get('orders/mine')
  listMyOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
    @Query('releaseId') releaseId?: string,
  ) {
    return this.market.listMyOrders(
      user.id,
      query.page,
      query.pageSize,
      releaseId,
    );
  }

  @Post('listings')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  createListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateListingDto,
    @Req() req: Request,
  ) {
    return this.market.createListing(user.id, dto, requestMeta(req));
  }

  @Post('listings/:id/cancel')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  cancelListing(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.market.cancelListing(user.id, id, requestMeta(req));
  }

  @Post('trades')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  buyListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: BuyTradeDto,
    @Req() req: Request,
  ) {
    return this.market.buyListing(user.id, dto.listingId, requestMeta(req));
  }

  @Get('trades')
  listTrades(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.market.listTrades(user.id, query.page, query.pageSize);
  }

  @Get('trades/:id')
  getTrade(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.market.getTrade(user.id, id);
  }
}
