import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import { AdminNoteDto } from './dto/admin-user.dto';
import { AdminSecondaryMarketQueryDto } from './dto/admin-secondary-market-query.dto';
import { AdminSecondaryMarketService } from './admin-secondary-market.service';

@Controller('api/admin/v1/secondary-market')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSecondaryMarketOverviewController {
  constructor(private readonly market: AdminSecondaryMarketService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminSecondaryMarketQueryDto,
  ) {
    return this.market.getSummary(user.roles, query);
  }

  @Get('liquidity')
  liquidity(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminSecondaryMarketQueryDto,
  ) {
    return this.market.getLiquidity(user.roles, query);
  }

  @Get('fees')
  fees(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminSecondaryMarketQueryDto,
  ) {
    return this.market.getFees(user.roles, query);
  }
}

@Controller('api/admin/v1/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminListingsController {
  constructor(private readonly market: AdminSecondaryMarketService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminSecondaryMarketQueryDto,
  ) {
    return this.market.listListings(user.roles, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.market.getListingById(user.roles, id, include);
  }

  @Post(':id/freeze')
  freeze(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.market.freezeListing(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/release')
  release(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.market.releaseListing(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.market.cancelListing(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }
}

@Controller('api/admin/v1/trades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminTradesController {
  constructor(private readonly market: AdminSecondaryMarketService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminSecondaryMarketQueryDto,
  ) {
    return this.market.listTrades(user.roles, query);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.market.getTradeById(user.roles, id, include);
  }

  @Post(':id/mark-suspicious')
  markSuspicious(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminNoteDto,
    @Req() req: Request,
  ) {
    return this.market.markTradeSuspicious(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }
}
